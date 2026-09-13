export default function Rodape() {
  return (
    <footer className="rodape-app">
      <span>&copy; {new Date().getFullYear()} Frontal Rastreamento. Todos os direitos reservados.</span>
      <span>
        Desenvolvido por{' '}
        <a href="https://hvsn.com.br/" target="_blank" rel="noopener noreferrer">
          HVSN
        </a>
        .
      </span>
    </footer>
  );
}
