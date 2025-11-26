'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './listas.module.css';
import Link from 'next/link';

export default function Listas() {
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarParticipantes();
  }, []);

  const carregarParticipantes = async () => {
    try {
      const q = query(collection(db, 'participantes'), orderBy('nome'));
      const querySnapshot = await getDocs(q);
      const dados = [];
      
      querySnapshot.forEach((doc) => {
        dados.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setParticipantes(dados);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      setErro('Erro ao carregar as listas. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  };

  const participantesFiltrados = participantes.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const ehImagem = (texto) => {
    if (!texto) return false;
    const imagemRegex = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
    const urlRegex = /^https?:\/\/.+/i;
    return urlRegex.test(texto) && imagemRegex.test(texto);
  };

  const ehLink = (texto) => {
    if (!texto) return false;
    const urlRegex = /^https?:\/\/.+/i;
    return urlRegex.test(texto) && !ehImagem(texto);
  };

  const formatarItem = (item, index) => {
    // Suporta tanto formato antigo (string) quanto novo (objeto)
    let descricao = '';
    let link = '';

    if (typeof item === 'string') {
      // Formato antigo: item é só uma string
      descricao = item;
      link = '';
    } else {
      // Formato novo: item é objeto com descricao e link
      descricao = item.descricao || '';
      link = item.link || '';
    }

    // Se tem link de imagem, mostra a imagem
    if (ehImagem(link)) {
      return (
        <div className={styles.itemConteudo}>
          {descricao && <p className={styles.descricaoItem}>{descricao}</p>}
          <div className={styles.imagemContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={link} 
              alt={descricao || `Presente ${index + 1}`}
              className={styles.imagemItem}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.linkItem}
              style={{ display: 'none' }}
            >
              Ver imagem
            </a>
          </div>
        </div>
      );
    }
    
    // Se tem link normal, mostra descrição como link
    if (ehLink(link)) {
      return (
        <div className={styles.itemConteudo}>
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.linkDescricao}
          >
            {descricao}
            <span className={styles.linkIcone}>🔗</span>
          </a>
        </div>
      );
    }

    // Se for formato antigo com link/imagem na descrição
    if (ehImagem(descricao)) {
      return (
        <div className={styles.imagemContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={descricao} 
            alt={`Presente ${index + 1}`}
            className={styles.imagemItem}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <a 
            href={descricao} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.linkItem}
            style={{ display: 'none' }}
          >
            Ver imagem
          </a>
        </div>
      );
    }

    if (ehLink(descricao)) {
      return (
        <a 
          href={descricao} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.linkItem}
        >
          {descricao.length > 60 ? descricao.substring(0, 60) + '...' : descricao}
        </a>
      );
    }
    
    // Se for só texto, mostra o texto
    return <span className={styles.textoItem}>{descricao}</span>;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Carregando listas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>🎁 Listas de Desejos</h1>
          <p>Confira o que cada pessoa gostaria de ganhar</p>
        </header>

        <div className={styles.topBar}>
          <Link href="/" className={styles.btnVoltar}>
            ← Voltar
          </Link>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={styles.inputBusca}
            aria-label="Buscar participante"
          />
        </div>

        {erro && (
          <div className={styles.erro} role="alert">
            {erro}
          </div>
        )}

        {participantesFiltrados.length === 0 && !erro && (
          <div className={styles.vazio}>
            {busca ? (
              <p>Nenhum participante encontrado com esse nome.</p>
            ) : (
              <>
                <p>Ainda não há ninguém na lista!</p>
                <Link href="/" className={styles.linkCadastro}>
                  Seja o primeiro a adicionar sua lista 🎄
                </Link>
              </>
            )}
          </div>
        )}

        <div className={styles.grid}>
          {participantesFiltrados.map((participante) => (
            <div key={participante.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>{participante.nome}</h2>
                <span className={styles.badge}>
                  {participante.itens.length} {participante.itens.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <ul className={styles.lista}>
                {participante.itens.map((item, index) => (
                  <li key={index} className={styles.itemLista}>
                    {formatarItem(item, index)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p>Total de participantes: {participantes.length}/20</p>
        </div>
      </div>
    </div>
  );
}