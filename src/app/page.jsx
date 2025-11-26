'use client';

import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  const [nome, setNome] = useState('');
  const [itens, setItens] = useState([{ descricao: '', link: '' }]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [linkEdicao, setLinkEdicao] = useState('');
  const [mostrarLink, setMostrarLink] = useState(false);

  const adicionarItem = () => {
    setItens([...itens, { descricao: '', link: '' }]);
  };

  const removerItem = (index) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens.length > 0 ? novosItens : [{ descricao: '', link: '' }]);
  };

  const atualizarDescricao = (index, valor) => {
    const novosItens = [...itens];
    novosItens[index].descricao = valor;
    setItens(novosItens);
  };

  const atualizarLink = (index, valor) => {
    const novosItens = [...itens];
    novosItens[index].link = valor;
    setItens(novosItens);
  };

  const verificarNomeExistente = async (nome) => {
    const q = query(collection(db, 'participantes'), where('nome', '==', nome));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  // Gera um código único seguro
  const gerarCodigoUnico = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let codigo = '';
    for (let i = 0; i < 12; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkEdicao);
    alert('✅ Link copiado! Cole onde quiser guardar.');
  };

  const enviarWhatsApp = () => {
    const mensagem = `🎄 Meu link para editar minha lista do amigo secreto:\n\n${linkEdicao}\n\n(Guarde este link para poder alterar sua lista depois!)`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const salvarLista = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setMostrarLink(false);

    if (!nome.trim()) {
      setErro('Por favor, digite seu nome!');
      return;
    }

    // Valida que pelo menos um item tem descrição
    const itensValidos = itens.filter(item => item.descricao.trim() !== '');
    if (itensValidos.length === 0) {
      setErro('Adicione pelo menos um item na sua lista!');
      return;
    }

    setLoading(true);

    try {
      // Verifica se o nome já existe
      const nomeExiste = await verificarNomeExistente(nome.trim());
      
      if (nomeExiste) {
        setErro('Esse nome já foi cadastrado! Se você quer atualizar sua lista, use o link que você recebeu ao cadastrar.');
        setLoading(false);
        return;
      }

      // Gera código único para edição
      const codigoEdicao = gerarCodigoUnico();

      // Limpa os links vazios e prepara os dados
      const itensSalvar = itensValidos.map(item => ({
        descricao: item.descricao.trim(),
        link: item.link.trim()
      }));

      // Salva no Firebase
      await addDoc(collection(db, 'participantes'), {
        nome: nome.trim(),
        itens: itensSalvar,
        codigoEdicao: codigoEdicao,
        dataCriacao: new Date().toISOString()
      });

      // Gera o link de edição
      const urlBase = window.location.origin;
      const linkCompleto = `${urlBase}/editar/${codigoEdicao}`;
      setLinkEdicao(linkCompleto);

      setMensagem('Lista salva com sucesso! 🎉');
      setMostrarLink(true);
      setNome('');
      setItens([{ descricao: '', link: '' }]);
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setErro('Erro ao salvar sua lista. Tente novamente!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1>🎄 Amigo Secreto da Família Schutz 🎅</h1>
          <p>Adicione seu nome e os presentes que você gostaria de ganhar!</p>
        </header>

        {!mostrarLink ? (
          <form onSubmit={salvarLista} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="nome">Seu nome:</label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Lista de desejos:</label>
              <div className={styles.dica}>
                💡 Você pode adicionar links de lojas ou fotos (opcional)!
              </div>
              
              {itens.map((item, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemNumero}>Item {index + 1}</div>
                  
                  <div className={styles.itemCampos}>
                    <div className={styles.campoCompleto}>
                      <label className={styles.labelPequeno}>
                        O que você quer ganhar: <span className={styles.obrigatorio}>*</span>
                      </label>
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => atualizarDescricao(index, e.target.value)}
                        placeholder="Ex: Tênis Nike Air Max preto tamanho 42"
                        className={styles.input}
                        disabled={loading}
                      />
                    </div>

                    <div className={styles.campoCompleto}>
                      <label className={styles.labelPequeno}>
                        Link (opcional):
                      </label>
                      <input
                        type="text"
                        value={item.link}
                        onChange={(e) => atualizarLink(index, e.target.value)}
                        placeholder="Cole aqui o link da loja, foto, etc..."
                        className={styles.input}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className={styles.btnRemoverCard}
                      disabled={loading}
                      aria-label="Remover item"
                    >
                      🗑️ Remover
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={adicionarItem}
                className={styles.btnAdicionar}
                disabled={loading}
              >
                + Adicionar mais um item
              </button>
            </div>

            {erro && (
              <div className={styles.erro} role="alert">
                {erro}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.btnSalvar}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar minha lista'}
            </button>
          </form>
        ) : (
          <div className={styles.sucessoContainer}>
            <div className={styles.sucessoIcone}>✅</div>
            <h2 className={styles.sucessoTitulo}>Lista salva com sucesso!</h2>
            
            <div className={styles.alertaImportante}>
              <strong>⚠️ IMPORTANTE:</strong>
              <p>Guarde o link abaixo para poder editar sua lista depois!</p>
            </div>

            <div className={styles.linkContainer}>
              <p className={styles.linkLabel}>Seu link de edição:</p>
              <div className={styles.linkBox}>
                {linkEdicao}
              </div>
            </div>

            <div className={styles.botoesLink}>
              <button 
                onClick={copiarLink}
                className={styles.btnCopiar}
              >
                📋 Copiar link
              </button>
              
              <button 
                onClick={enviarWhatsApp}
                className={styles.btnWhatsApp}
              >
                💬 Enviar para mim no WhatsApp
              </button>
            </div>

            <div className={styles.instrucoes}>
              <h3>📌 Como usar:</h3>
              <ol>
                <li>Clique em &ldquo;Enviar para mim no WhatsApp&rdquo;</li>
                <li>Mande a mensagem para você mesmo</li>
                <li>Quando quiser editar, é só clicar no link!</li>
              </ol>
            </div>

            <button 
              onClick={() => {
                setMostrarLink(false);
                setMensagem('');
              }}
              className={styles.btnVoltar}
            >
              Cadastrar outra pessoa
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <Link href="/listas" className={styles.link}>
            Ver todas as listas 👀
          </Link>
        </div>
      </div>
    </div>
  );
}