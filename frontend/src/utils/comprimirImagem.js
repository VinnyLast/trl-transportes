// Reduz a resolucao/tamanho de uma foto antes de enviar. Fotos de camera de
// celular podem vir com 10-50MB e resolucao altissima, o que faz alguns
// navegadores (principalmente em celulares com pouca memoria) travarem com
// erro de "memoria insuficiente" ao processar. Aqui a imagem e redesenhada
// num canvas menor e reexportada como JPEG comprimido antes do envio.
// 1280px / 60% deixa o romaneio legivel com ~150-300 KB por foto.
export function comprimirImagem(arquivo, { larguraMaxima = 1280, qualidade = 0.6 } = {}) {
  return new Promise((resolve) => {
    const urlOriginal = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      URL.revokeObjectURL(urlOriginal);

      const escala = Math.min(1, larguraMaxima / imagem.width);
      const largura = Math.round(imagem.width * escala);
      const altura = Math.round(imagem.height * escala);

      const canvas = document.createElement('canvas');
      canvas.width = largura;
      canvas.height = altura;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imagem, 0, 0, largura, altura);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(arquivo); // fallback: usa o arquivo original se a compressao falhar
            return;
          }
          const nomeComprimido = (arquivo.name || 'romaneio').replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], nomeComprimido, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        qualidade
      );
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(urlOriginal);
      resolve(arquivo); // fallback: usa o arquivo original se nao conseguir decodificar
    };

    imagem.src = urlOriginal;
  });
}
