#!/bin/bash

# Script de Deploy Automático para Vercel
# Rio de Janeiro Census Sector Identification System

echo "🚀 Iniciando deploy do Sistema de Setores Censitários do Rio de Janeiro..."
echo "================================================================="

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Verificar se está logado no Vercel
echo "🔐 Verificando login no Vercel..."
vercel whoami || {
    echo "❌ Você precisa fazer login no Vercel primeiro:"
    echo "   Execute: vercel login"
    exit 1
}

# Build do projeto
echo "🔨 Buildando o projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Falha no build. Verifique os erros acima."
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Deploy no Vercel
echo "🌐 Iniciando deploy no Vercel..."
vercel --prod

echo "🎉 Deploy concluído!"
echo "📱 Seu sistema está online em:"
echo "   https://rio-census-sector.vercel.app"
echo ""
echo "🔗 Links úteis:"
echo "   - Dashboard: https://vercel.com/dashboard"
echo "   - Analytics: https://vercel.com/analytics"
echo "   - Logs: https://vercel.com/logs"