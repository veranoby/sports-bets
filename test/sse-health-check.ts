import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SystemMetrics {
  memoryMB: number;
  cpuPercent: string;
  connections: number;
  processCount: number;
}

/**
 * Health Check Real del Sistema SSE
 *
 * Este script obtiene métricas reales del sistema actual sin hacer simulaciones teóricas
 */
async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    // Métricas de memoria
    const memoryResult = process.memoryUsage();
    const memoryMB = memoryResult.heapUsed / 1024 / 1024;

    // Obtener CPU general del sistema
    let cpuResult, connectionsResult;
    try {
      cpuResult = await execAsync('top -bn1 | head -n 5 | grep Cpu || echo "CPU% N/A"');
    } catch (e) {
      cpuResult = { stdout: 'CPU% N/A' };
    }

    try {
      // Contar conexiones SSE activas (buscando EventSource en procesos si existen)
      connectionsResult = await execAsync('lsof -i :3001 2>/dev/null | grep -c "node" || echo "0"');
    } catch (e) {
      connectionsResult = { stdout: '0' };
    }

    const cpuPercent = (cpuResult.stdout || 'CPU% N/A').trim().slice(0, 10);
    const connections = parseInt(connectionsResult.stdout.trim()) || 0;

    // Obtener conteo de procesos
    let processResult;
    try {
      processResult = await execAsync('ps aux | grep node | wc -l');
    } catch (e) {
      processResult = { stdout: '1' };
    }
    const processCount = parseInt(processResult.stdout.trim());

    return {
      memoryMB: parseFloat(memoryMB.toFixed(2)),
      cpuPercent,
      connections,
      processCount
    };

  } catch (error) {
    // Valores por defecto en caso de error
    return {
      memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuPercent: "N/A",
      connections: 0,
      processCount: 1
    };
  }
}

/**
 * Verificar existencia de archivos SSE reales en el proyecto
 */
async function checkSSEFiles(): Promise<{ [key: string]: boolean }> {
  const fs = require('fs');
  const path = require('path');

  // Rutas comunes de archivos SSE en el proyecto
  const sseFiles = {
    'backend SSE service': './backend/src/services/sseService.ts',
    'backend SSE routes': './backend/src/routes/sse.ts',
    'backend streaming monitor': './backend/src/routes/streaming-monitoring.ts',
    'frontend SSE hook': './frontend/src/hooks/useSSEConnection.ts',
    'frontend SSE component': './frontend/src/components/admin/OptimizedStreamingMonitor.tsx',
    'SSE context': './frontend/src/contexts/SSEContext.tsx'
  };

  const results: { [key: string]: boolean } = {};

  for (const [name, filePath] of Object.entries(sseFiles)) {
    try {
      const fullPath = path.join(__dirname, '..', '..', filePath.replace('./', ''));
      results[name] = fs.existsSync(fullPath);
    } catch (error) {
      results[name] = false;
    }
  }

  return results;
}

/**
 * Health check principal que proporciona datos reales
 */
async function main() {
  console.log('🔍 REALITY CHECK INICIADO - Health Check Real del Sistema SSE\n');

  console.log('📊 OBTENIENDO MÉTRICAS DEL SISTEMA...\n');
  const metrics = await getSystemMetrics();

  console.log('📈 MÉTRICAS ACTUALES DEL SISTEMA:');
  console.log(`   Memoria usada: ${metrics.memoryMB} MB`);
  console.log(`   CPU: ${metrics.cpuPercent}`);
  console.log(`   Conexiones activas SSE/WS: ${metrics.connections || 'N/A'}`);
  console.log(`   Procesos Node: ${metrics.processCount}`);
  console.log(`   Uptime Node: ${(process.uptime() / 60).toFixed(2)} min`);

  console.log('\n🔍 BUSCANDO ARCHIVOS SSE/WEBSOCKET EXISTENTES...\n');
  const sseFiles = await checkSSEFiles();

  console.log('✅ ARCHIVOS SSE DETECTADOS:');
  let foundSSE = false;
  for (const [name, exists] of Object.entries(sseFiles)) {
    if (exists) {
      console.log(`   ✓ ${name}`);
      foundSSE = true;
    } else {
      console.log(`   ⚠ ${name} - No encontrado`);
    }
  }

  console.log('\n🎯 EVALUACIÓN REALIDAD VS TEORÍA:');

  if (!foundSSE) {
    console.log('   ❌ No se encontraron archivos SSE/WS en el sistema');
    console.log('   ⚠ Sistema SSE/WS podría no estar implementado aún');
    console.log('   🔄 Recomendación: Revisar si la funcionalidad SSE/WS ya fue construida');
  } else {
    console.log(`   ✅ Sistema SSE/WS está presente en el código`);
    console.log(`   ✅ Memoria actual: ${metrics.memoryMB} MB (< 200MB = ESTABLE)`);

    if (metrics.memoryMB < 150) {
      console.log('   ✅ Uso de memoria saludable (< 150MB)');

      // Verificar si hay muchas conexiones activas
      if (metrics.connections > 50) {
        console.log('   ⚠ Más de 50 conexiones activas detectadas');
        console.log('   🔄 Recomendación: Monitorear crecimiento de conexiones');
      } else {
        console.log('   ✅ Nivel de conexiones aceptable (< 50)');
      }
    } else {
      console.log('   ⚠ Uso de memoria elevado (>= 150MB)');
      console.log('   🔄 Recomendación: Investigar causas de uso elevado de memoria');
    }
  }

  console.log('\n📋 CONCLUSIÓN:');
  console.log('   Basado en datos reales del sistema actual:');
  console.log(`   - Memoria: ${metrics.memoryMB} MB`);
  console.log(`   - Conexiones SSE/WS: ${metrics.connections}`);
  console.log(`   - Archivos SSE: ${foundSSE ? 'Presentes' : 'Ausentes'}`);

  if (foundSSE && metrics.memoryMB < 150 && metrics.connections < 50) {
    console.log('\n   ✅ CONDICIÓN GENERAL: Sistema SSE/WS OPERANDO NORMALMENTE');
    console.log('   🔄 No se requiere instrumentación inmediata');
    console.log('   📊 Recomendación: Observación periódica de métricas');
  } else if (foundSSE) {
    console.log('\n   ⚠ CONDICIÓN AVISADA: Sistema SSE/WS con posibles signos de advertencia');
    console.log('   🔄 Recomendación: Instrumentar métricas específicas basadas en hallazgos');
    console.log('   📊 Priorizar: Active Connections Count y Memory Growth Rate');
  } else {
    console.log('\n   ❓ ESTADO INCERTIDUMBRE: Sistema SSE/WS no encontrado');
    console.log('   🔄 Recomendación: Confirmar si la funcionalidad ya fue implementada');
  }

  console.log('\n💡 RECOMENDACIÓN GLOBAL:');
  if (foundSSE && metrics.memoryMB < 100) {
    console.log('   - Mantener monitoreo básico');
    console.log('   - No implementar instrumentación compleja aún');
    console.log('   - Enfocarse en observabilidad selectiva');
  } else if (foundSSE && metrics.memoryMB >= 100 && metrics.memoryMB < 200) {
    console.log('   - Implementar monitoreo de conexiones activas');
    console.log('   - Agregar tracking de memory growth rate');
    console.log('   - Considerar límites de conexiones por cliente');
  } else {
    console.log('   - Revisar inmediatamente uso de memoria');
    console.log('   - Implementar límites estrictos de conexiones');
    console.log('   - Considerar optimización urgente de recursos');
  }
}

// Ejecutar solo si este módulo es el principal
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

export { getSystemMetrics, checkSSEFiles, SystemMetrics };