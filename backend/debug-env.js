// backend/debug-env.js - Archivo temporal para diagnosticar el problema
require('dotenv').config();

console.log('🔍 DIAGNÓSTICO DE VARIABLES DE ENTORNO');
console.log('=====================================');
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
    console.log('✅ DATABASE_URL encontrada');
    console.log('📄 Preview:', process.env.DATABASE_URL.substring(0, 60) + '...');
    
    // Verificar que es una URL de Neon válida
    const isNeonUrl = process.env.DATABASE_URL.includes('neon.tech');
    console.log('🌐 Es URL de Neon.tech:', isNeonUrl);
    
    if (isNeonUrl) {
        console.log('✅ Configuración correcta para Neon.tech');
    } else {
        console.log('⚠️  URL no parece ser de Neon.tech');
    }
} else {
    console.log('❌ DATABASE_URL NO encontrada');
    console.log('💡 Verifica que el archivo .env esté en backend/.env');
}

// Verificar archivo .env
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

console.log('\n📁 VERIFICACIÓN DE ARCHIVO .env');
console.log('===============================');
console.log('Buscando .env en:', envPath);
console.log('Archivo existe:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const dbLine = lines.find(line => line.startsWith('DATABASE_URL='));
    
    if (dbLine) {
        console.log('✅ DATABASE_URL encontrada en .env');
        console.log('📄 Línea:', dbLine.substring(0, 60) + '...');
    } else {
        console.log('❌ DATABASE_URL NO encontrada en .env');
    }
} else {
    console.log('❌ Archivo .env no existe en la ubicación esperada');
    console.log('💡 Debe estar en: backend/.env');
}

console.log('\n🔧 SIGUIENTES PASOS:');
console.log('==================');
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')) {
    console.log('✅ Configuración parece correcta');
    console.log('💡 Si aún tienes problemas, verifica las correcciones en wallet.ts');
} else {
    console.log('❌ Problema con la configuración');
    console.log('1. Verifica que backend/.env existe');
    console.log('2. Verifica que DATABASE_URL está en el archivo');
    console.log('3. Verifica que la URL es de Neon.tech');
}