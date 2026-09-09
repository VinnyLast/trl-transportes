function limparNumeros(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function validarCPF(cpf) {
  const digits = limparNumeros(cpf);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digits[i], 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i], 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits[10], 10)) return false;

  return true;
}

function formatarCPF(cpf) {
  const digits = limparNumeros(cpf);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Aceita placa antiga (ABC1234) e Mercosul (ABC1D23)
function validarPlaca(placa) {
  const valor = String(placa || '').toUpperCase().replace(/[\s-]/g, '');
  const antiga = /^[A-Z]{3}[0-9]{4}$/;
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return antiga.test(valor) || mercosul.test(valor);
}

function normalizarPlaca(placa) {
  return String(placa || '').toUpperCase().replace(/[\s-]/g, '');
}

module.exports = {
  validarCPF,
  formatarCPF,
  validarPlaca,
  normalizarPlaca,
  limparNumeros,
};
