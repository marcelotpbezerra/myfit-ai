export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#080808', color: '#06b6d4', fontFamily: 'sans-serif' }}>
      <h1>MyFit.ai - Versão Final</h1>

      <p>Seu app de fitness com IA está chegando.</p>
      <a href="/dashboard" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#06b6d4', color: 'black', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>Entrar no Dashboard</a>
    </div>
  );
}
