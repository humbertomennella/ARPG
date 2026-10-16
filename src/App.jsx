import { useEffect, useState } from "react";
import AuthPanel from "./AuthPanel.jsx";

const sections = [
  { id: "inicio", label: "Início", number: "00" },
  { id: "arquivo", label: "Arquivo", number: "01" },
  { id: "metodo", label: "Método", number: "02" },
  { id: "registro", label: "Registro", number: "03" },
  { id: "acesso", label: "Acesso", number: "04" }
];

const records = [
  { id: "AR-000", type: "NOTA", date: "REGISTRO ABERTO", title: "O primeiro registro", description: "Uma investigação começa quando uma observação deixa de ser tratada como decoração.", state: "PÚBLICO" },
  { id: "AR-001", type: "PROTOCOLO", date: "ÍNDICE DE INTEGRIDADE", title: "Verifique antes de confiar", description: "Toda evidência publicada deve ter origem, versão e um método independente de verificação.", state: "PÚBLICO" },
  { id: "AR-002", type: "LACUNA", date: "ACESSO CONTROLADO", title: "O espaço entre registros", description: "Nem tudo o que falta é uma pista. Nem tudo o que parece completo está terminado.", state: "EM PREPARAÇÃO" }
];

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }

function Header({ active, navigate }) {
  return <header className="site-header">
    <a className="wordmark" href="#inicio" onClick={() => navigate("inicio")} aria-label="ARPG, início"><span className="mark">∴</span><span>ARPG<small>ARQUIVO DE INVESTIGAÇÃO</small></span></a>
    <nav aria-label="Navegação principal">{sections.map(item =>
      <a key={item.id} href={`#${item.id}`} className={active === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.number}</span>{item.label}</a>
    )}</nav>
    <div className="header-state"><i /> SISTEMA PÚBLICO</div>
  </header>;
}

function Home({ navigate }) {
  return <>
    <section className="hero">
      <div className="eyebrow"><span className="eyebrow-line" /> UM EXPERIMENTO EM INVESTIGAÇÃO ABERTA <span className="eyebrow-id">AR / 00</span></div>
      <div className="hero-grid">
        <div><h1>O que você<br/>não <em>percebeu.</em></h1><p className="hero-copy">Uma investigação construída em camadas. Evidências, ferramentas e ideias conectadas por algo que ainda não tem nome.</p>
          <div className="hero-actions"><a className="button primary" href="#arquivo" onClick={() => navigate("arquivo")}>Entrar no arquivo <span>↗</span></a><a className="text-link" href="#metodo" onClick={() => navigate("metodo")}>Como funciona <span>→</span></a></div>
        </div>
        <div className="diagram" aria-label="Diagrama abstrato de investigação">
          <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="orbit orbit-three"></div>
          <div className="diagram-core">∴</div><span className="node node-a">OBSERVAÇÃO</span><span className="node node-b">EVIDÊNCIA</span><span className="node node-c">HIPÓTESE</span><span className="diagram-coord">45° 09' S<br/>72° 41' W</span><span className="diagram-caption">FIG. 00 — SISTEMA DE REFERÊNCIA</span>
        </div>
      </div>
      <div className="hero-meta"><span><b>01</b> Observe sem presumir</span><span><b>02</b> Verifique cada evidência</span><span><b>03</b> Mude de hipótese quando necessário</span></div>
    </section>
    <section className="section-block">
      <div className="section-heading"><div><div className="eyebrow">PONTO DE PARTIDA / 001</div><h2>Não é um teste de inteligência.</h2></div><p>É um teste de método. O projeto cresce por descobertas verificáveis, não por adivinhações arbitrárias.</p></div>
      <div className="principles-grid">
        <article className="principle"><span className="principle-index">A / 01</span><Icon>⌁</Icon><h3>Evidência antes de teoria</h3><p>Uma hipótese só vale o que suas verificações independentes sustentam.</p></article>
        <article className="principle"><span className="principle-index">B / 02</span><Icon>⌘</Icon><h3>Ferramentas são parte da jornada</h3><p>Aprender a inspecionar dados, escrever pequenos programas e ler formatos faz parte da investigação.</p></article>
        <article className="principle"><span className="principle-index">C / 03</span><Icon>⟁</Icon><h3>Confiança não é requisito</h3><p>Os artefatos públicos devem permitir verificação sem depender da palavra de quem os publicou.</p></article>
      </div>
    </section>
    <section className="callout"><div><div className="eyebrow">ESTADO DO PROJETO</div><h2>O arquivo está sendo construído.</h2><p>Esta é a infraestrutura inicial. O desafio completo ainda não foi lançado e nenhuma recompensa está sendo anunciada como financiada.</p></div><a href="#registro" className="button outline" onClick={() => navigate("registro")}>Ver registro de estado <span>↗</span></a></section>
  </>;
}

function Archive() {
  const [filter, setFilter] = useState("TODOS");
  const visible = records.filter(r => filter === "TODOS" || r.type === filter);
  return <section className="page-content"><div className="eyebrow">ARQUIVO / ÍNDICE PÚBLICO</div><h1 className="page-title">Registros <em>disponíveis.</em></h1><p className="page-intro">Artefatos de domínio público e documentos de referência. Itens marcados como em preparação não fazem parte de um desafio ativo.</p>
    <div className="filter-row" aria-label="Filtrar registros">{["TODOS","NOTA","PROTOCOLO","LACUNA"].map(f => <button key={f} className={filter === f ? "filter active-filter" : "filter"} onClick={() => setFilter(f)}>{f}</button>)}</div>
    <div className="record-list">{visible.map((r, i) => <article className="record" key={r.id}><div className="record-number">{String(i+1).padStart(2,"0")}</div><div className="record-main"><div className="record-meta"><span>{r.id}</span><span>{r.type}</span><span>{r.date}</span></div><h2>{r.title}</h2><p>{r.description}</p></div><div className={r.state === "PÚBLICO" ? "record-state" : "record-state pending"}>{r.state}</div></article>)}</div>
    <p className="small-note"><span>i</span> Nenhum item desta versão contém uma resposta final, segredo operacional ou credencial.</p>
  </section>;
}

function Method() {
  return <section className="page-content"><div className="eyebrow">MÉTODO / PRINCÍPIOS OPERACIONAIS</div><h1 className="page-title">Duvide com <em>método.</em></h1><p className="page-intro">O desafio será difícil por causa das conexões entre disciplinas e da qualidade das evidências, nunca porque o autor decidiu esconder as regras depois do jogo começar.</p>
    <div className="method-list">
      {[["01","Origem verificável","Cada artefato publicado deve ter proveniência e integridade verificáveis."],["02","Hipóteses testáveis","Uma pista precisa permitir experimentos que possam confirmar ou refutar interpretações."],["03","Segurança por padrão","Nenhuma etapa exigirá invasão, exposição de dados pessoais, instalação de software suspeito ou pagamento a terceiros."],["04","Cooperação legítima","A colaboração pode ser útil. A submissão deve reconhecer contribuições compartilhadas quando o regulamento for publicado."],["05","Persistência responsável","As etapas terão documentação de continuidade para não depender de um serviço temporário ou de uma pessoa inacessível."]].map(([n,t,d]) => <article key={n}><span>{n}</span><div><h2>{t}</h2><p>{d}</p></div><b>↗</b></article>)}
    </div>
  </section>;
}

function Register() {
  const entries = [
    ["2026-10-16","BASE DO PROJETO","Repositório público inicial verificado."],
    ["EM ANDAMENTO","ARQUITETURA","Aplicação, documentação técnica e endpoint de submissão em construção."],
    ["VERIFICADO","BANCO DE DADOS","Projeto Supabase dedicado criado; políticas privadas e limite de submissões configurados."],
    ["NÃO LANÇADO","DESAFIO E RECOMPENSA","Etapas finais, custódia e prêmio ainda não publicados."]
  ];
  return <section className="page-content"><div className="eyebrow">REGISTRO / ESTADO PÚBLICO</div><h1 className="page-title">Nada será declarado <em>sem prova.</em></h1><p className="page-intro">Este painel separa o que foi verificado do que ainda está sendo construído. O projeto não usa cronômetros falsos, contagens artificiais ou alegações de comprometimento externo.</p>
    <div className="timeline">{entries.map(([date,title,detail],i)=><article key={title}><div className="timeline-mark">{i===0?"✓":"·"}</div><div><span>{date}</span><h2>{title}</h2><p>{detail}</p></div></article>)}</div>
    <div className="integrity-note"><span className="integrity-symbol">⌁</span><div><strong>Uma observação sobre confiança</strong><p>O código público permite auditar a interface. Isso não significa que uma infraestrutura externa, uma recompensa ou um mecanismo secreto já estejam configurados.</p></div></div>
  </section>;
}

function Footer() {
  return <footer className="site-footer"><div className="footer-brand"><span className="mark">∴</span><span>ARPG<small>ARQUIVO DE INVESTIGAÇÃO</small></span></div><p>Investigue. Verifique. Não presuma.</p><span className="footer-code">BUILD 0.1 / FOUNDATION</span></footer>;
}

export default function App() {
  const getRoute = () => {
    const id = window.location.hash.replace("#", "");
    return sections.some(s => s.id === id) ? id : "inicio";
  };
  const [active, setActive] = useState(getRoute);
  useEffect(() => {
    const onHash = () => setActive(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = id => setActive(id);
  return <div className="app-shell"><Header active={active} navigate={navigate}/><main className="main-content">
    {active === "inicio" && <Home navigate={navigate}/>}
    {active === "arquivo" && <Archive/>}
    {active === "metodo" && <Method/>}
    {active === "registro" && <Register/>}
    {active === "acesso" && <AuthPanel/>}
  </main><Footer/></div>;
}