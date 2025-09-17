# Sistema de Identificação de Setores Censitários do Rio de Janeiro

## 🌐 Acesso Online

### Versão Publicada (Recomendado)
Acesse o sistema online sem precisar instalar nada:
👉 **[https://rio-census-sector.vercel.app](https://rio-census-sector.vercel.app)**

## 📋 Sobre o Projeto

Sistema web para identificar setores censitários do IBGE para qualquer endereço ou coordenadas no Estado do Rio de Janeiro, cobrindo todos os 92 municípios.

### ✨ Funcionalidades

- 🔍 **Busca por Endereço**: Digite qualquer endereço no Rio de Janeiro
- 📍 **Busca por Coordenadas**: Informe latitude e longitude
- 🏙️ **Cobertura Completa**: Todos os 92 municípios do estado
- 🎯 **Identificação Precisa**: Gera códigos de setor censitário únicos
- 📊 **Exportação de Dados**: Exporte resultados em CSV
- 🔄 **Atualização em Tempo Real**: Feedback instantâneo

## 🚀 Como Usar

### Versão Online (Sem Instalação)

1. Acesse: **[https://rio-census-sector.vercel.app](https://rio-census-sector.vercel.app)**
2. Escolha o tipo de busca:
   - **Por Endereço**: Digite o endereço completo
   - **Por Coordenadas**: Informe latitude e longitude
3. Clique em "Buscar"
4. Veja o resultado com o código do setor censitário

### Exemplos de Uso

#### Por Endereço:
```
Avenida Atlântica, Copacabana, Rio de Janeiro
Rua Principal, Centro, Volta Redonda
Estrada da Gávea, São Conrado, Rio de Janeiro
```

#### Por Coordenadas:
```
Latitude: -22.9068
Longitude: -43.1729
```

## 📱 API Endpoints

### Buscar Setor Censitário
```bash
curl -X POST https://rio-census-sector.vercel.app/api/setor-censitario \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "endereco",
    "endereco": "Seu endereço aqui"
  }'
```

### Resposta da API:
```json
{
  "codigoSetorCensitario": "3304557123456",
  "municipio": "Rio de Janeiro",
  "bairro": "Copacabana",
  "enderecoPesquisado": "Avenida Atlântica, Copacabana, Rio de Janeiro"
}
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15 + TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Geocodificação**: ZAI Web SDK
- **Deploy**: Vercel
- **Banco de Dados**: Prisma (SQLite)

## 📊 Municípios Cobertos

O sistema cobre todos os 92 municípios do Rio de Janeiro, incluindo:

- Rio de Janeiro
- São Gonçalo
- Niterói
- Duque de Caxias
- Nova Iguaçu
- Volta Redonda
- Petrópolis
- Teresópolis
- Cabo Frio
- Angra dos Reis
- E todos os outros municípios do estado

## 🔧 Instalação Local (Opcional)

Se você preferir rodar localmente:

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Passos
```bash
# Clonar o repositório
git clone <URL_DO_REPOSITORIO>
cd nome-do-projeto

# Instalar dependências
npm install

# Iniciar servidor
npm run dev

# Acessar
http://localhost:3000
```

## 📄 Licença

Este projeto é gratuito e de uso livre para fins educacionais e de pesquisa.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📞 Suporte

Se encontrar algum problema:
- Abra uma issue no GitHub
- Envie um email para suporte
- Use a versão online que sempre estará atualizada

---

**Desenvolvido com ❤️ para o Estado do Rio de Janeiro**