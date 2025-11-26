'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './editar.module.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditarLista() {
  const params = useParams();
  const codigo = params.codigo;

  const [nome, setNome] = useState('');
  const [itens, setItens] = useState([{ descricao: '', link: '' }]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [participanteId, setParticipanteId] = useState('');
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'participantes'), 
        where('codigoEdicao', '==', codigo)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setNaoEncontrado(true);
        setLoading(false);
        return;
      }

      const dados = querySnapshot.docs[0];
      const participante = dados.data();

      setParticipanteId(dados.id);
      setNome(participante.nome);
      
      // Converte dados antigos (string) para novo formato (objeto)
      const itensCarregados = participante.itens || [];
      const itensConvertidos = itensCarregados.map(item => {
        // Se for string (formato antigo), converte para objeto
        if (typeof item === 'string') {
          return { descricao: item, link: '' };
        }
        // Se já for objeto (formato novo), usa direto
        return item;
      });
      
      setItens(itensConvertidos.length > 0 ? itensConvertidos : [{ descricao: '', link: '' }]);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar seus dados. Tente recarregar a página.');
      setLoading(false);
    }
  }, [codigo]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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

  const salvarAlteracoes = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    // Valida que pelo menos um item tem descrição
    const itensValidos = itens.filter(item => item.descricao.trim() !== '');
    if (itensValidos.length === 0) {
      setErro('Adicione pelo menos um item na sua lista!');
      return;
    }

    setSalvando(true);

    try {
      // Limpa os links vazios e prepara os dados
      const itensSalvar = itensValidos.map(item => ({
        descricao: item.descricao.trim(),
        link: item.link.trim()
      }));

      const docRef = doc(db, 'participantes', participanteId);
      await updateDoc(docRef, {
        itens: itensSalvar,
        dataUltimaEdicao: new Date().toISOString()
      });

      setMensagem('Alterações salvas com sucesso! ✅');
      
      setTimeout(() => {
        setMensagem('');
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      setErro('Erro ao salvar. Tente novamente!');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Carregando sua lista...</p>
        </div>
      </div>
    );
  }

  if (naoEncontrado) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.erroContainer}>
            <div className={styles.erroIcone}>❌</div>
            <h2>Lista não encontrada</h2>
            <p>Este link não é válido ou a lista foi removida.</p>
            <Link href="/" className={styles.btnVoltar}>
              Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1>✏️ Editar Minha Lista</h1>
          <p className={styles.nomeDestaque}>{nome}</p>
        </header>

        <form onSubmit={salvarAlteracoes} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Minha lista de desejos:</label>
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
                      disabled={salvando}
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
                      disabled={salvando}
                    />
                  </div>
                </div>

                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerItem(index)}
                    className={styles.btnRemoverCard}
                    disabled={salvando}
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
              disabled={salvando}
            >
              + Adicionar mais um item
            </button>
          </div>

          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className={styles.sucesso} role="status">
              {mensagem}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.btnSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : '💾 Salvar alterações'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/listas" className={styles.link}>
            Ver todas as listas 👀
          </Link>
        </div>

        <div className={styles.avisoImportante}>
          <strong>📌 Importante:</strong> Guarde este link! Você precisará dele para editar sua lista novamente.
        </div>
      </div>
    </div>
  );
}