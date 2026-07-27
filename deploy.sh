#!/bin/bash

# =============================================
# PARKU API - SCRIPT DE DESPLIEGUE
# =============================================

echo "🚀 Iniciando despliegue de ParkU API..."

# 1. Pull cambios
echo "📥 Pull de cambios..."
git pull origin main

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production

# 3. Ejecutar migraciones
echo "🗄️  Ejecutando migraciones..."
node scripts/migrate.js

# 4. Reiniciar PM2
echo "🔄 Reiniciando aplicación..."
pm2 restart parku-api

# 5. Ver estado
echo "📊 Estado de la aplicación:"
pm2 status

echo "✅ Despliegue completado!"