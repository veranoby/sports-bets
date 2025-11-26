# 📋 MANUAL DE MANTENIMIENTO: PostgreSQL Local (Semanal)

**Para:** GalloBets con Nginx RTMP + PostgreSQL local
**Frecuencia:** Actividades semanales (30 min/semana)
**Responsable:** Veranoby o DevOps designado

---

## 📌 MIGRACIÓN COMPLETADA (2025-11-25)

**Status:** ✅ Database migration from Neon Tech to PostgreSQL local COMPLETED

**Migration details:**
- Schema: migracion.sql with 22 ENUMs, 19 tables, 26 FKs created successfully
- Data imported: 5 tables from Neon Tech to local (users:9, system_settings:88, subscriptions:2, articles:1, membership_change_requests:2)
- Method: Manual CSV export from Neon SQL Editor → COPY FROM in local PostgreSQL
- Database location: 127.0.0.1:5432 (user: postgres, password: 0102Mina)
- Backup of old config preserved: /tmp/nginx.conf.backup

**Files updated:**
- backend/.env: DATABASE_URL, pricing (5.00/10.00), RTMP/HLS URLs
- backend/src/config/envValidator.ts: Updated defaults for subscription pricing
- Nginx config: RTMP module added, HLS generation enabled

---

## 🔍 TAREAS SEMANALES (Lunes 10:00 AM recomendado)

### ACTIVIDAD 1: Verificar Salud del Sistema (5 min)

**Comando:**
```bash
# SSH a tu servidor dedicado
ssh user@your-nginx-server.com

# Verificar si PostgreSQL está corriendo
sudo systemctl status postgresql

# Ver si hay conexiones activas
sudo -u postgres psql -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Ver tamaño de la BD
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('gallobets'));"
```

**Qué buscar:**
- Status: debe decir `active (running)`
- Conexiones: <20 (si ves >50, hay problema)
- Tamaño: debe crecer lentamente (no explotar de repente)

**Si ve problema:** ⚠️ Ir a TROUBLESHOOTING al final

---

### ACTIVIDAD 2: Backup Automático (3 min setup, 0 min semanal)

**Setup (HACER UNA SOLA VEZ):**
```bash
# Crear directorio para backups
sudo mkdir -p /var/backups/postgres
sudo chown postgres:postgres /var/backups/postgres

# Crear script de backup
sudo tee /usr/local/bin/backup-gallobets.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gallobets_$DATE.sql"

# Full backup comprimido
sudo -u postgres pg_dump gallobets | gzip > "$BACKUP_FILE.gz"

# Mantener últimos 4 backups (28 días si es 1/semana)
ls -t "$BACKUP_DIR"/gallobets_*.sql.gz | tail -n +5 | xargs -r rm

echo "✅ Backup completado: $BACKUP_FILE.gz"
EOF

sudo chmod +x /usr/local/bin/backup-gallobets.sh

# Agregar a cron (cada domingo 11:00 PM)
sudo crontab -e
# Agregar esta línea:
# 0 23 * * 0 /usr/local/bin/backup-gallobets.sh

# Verificar que está instalado
sudo crontab -l | grep backup
```

**Semanal (SOLO MONITOREAR):**
```bash
# Verificar que backup se ejecutó
ls -lh /var/backups/postgres/

# Debe haber un archivo nuevo cada semana con tamaño >100KB
# Ejemplo: gallobets_20251127_230001.sql.gz (12.5 MB)
```

**Verificar integridad cada mes:**
```bash
# Tomar el backup más reciente y probar restore (NO en producción):
# cp /var/backups/postgres/gallobets_LATEST.sql.gz /tmp/
# gzip -d /tmp/gallobets_LATEST.sql.gz
# sudo -u postgres psql testdb < /tmp/gallobets_LATEST.sql
# Si no hay errores, backup está OK
```

---

### ACTIVIDAD 3: Monitorear Espacio en Disco (2 min)

**Comando semanal:**
```bash
# Ver espacio total del servidor
df -h /

# Ver tamaño de PostgreSQL
du -sh /var/lib/postgresql/

# Ver tamaño de datos específico
sudo -u postgres psql -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

**Valores normales:**
- Disco total: Si es 500GB SSD → máximo 80% lleno es advertencia
- PostgreSQL: Debe crecer ~2-5% por semana con usuarios activos
- Tablas grandes: `events`, `bets`, `users` son las principales

**Si ves advertencia (>80% lleno):**
- ⚠️ Ir a TROUBLESHOOTING: "Disco casi lleno"

---

### ACTIVIDAD 4: Verificar Logs de Errores (3 min)

**Comando semanal:**
```bash
# Ver últimos 100 errores en PostgreSQL
sudo tail -100 /var/log/postgresql/postgresql.log | grep ERROR

# Ver si hay errores de conexión
sudo tail -50 /var/log/postgresql/postgresql.log | grep "connection"

# Ver queries lentas (si están loggadas)
sudo tail -50 /var/log/postgresql/postgresql.log | grep "duration:"
```

**Qué buscar:**
- ❌ `FATAL`: Problema serio → Investigar inmediatamente
- ❌ `ERROR: out of memory`: Base de datos saturada
- ⚠️ `WARNING`: Minor issue, monitor próxima semana
- ✅ `LOG`: Mensajes informativos normales

---

### ACTIVIDAD 5: Ejecutar VACUUM y ANALYZE (5 min)

**Comando semanal (ejecutar después de backup):**
```bash
# VACUUM: Limpia espacio muerto
# ANALYZE: Actualiza estadísticas para query optimizer
sudo -u postgres psql gallobets << 'EOF'
\timing on
VACUUM ANALYZE;
EOF
```

**Esperado:**
- Duración: 2-5 minutos (depende tamaño BD)
- Output: `VACUUM` sin errores
- Si tarda >10 min → BD tiene demasiados datos muertos → quizás necesitas `REINDEX`

**Alternativa automatizada (cron, en lugar de manual):**
```bash
# Agregar a crontab (miércoles 2:00 AM):
# 0 2 * * 3 sudo -u postgres psql gallobets -c "VACUUM ANALYZE;"
```

---

### ACTIVIDAD 6: Monitorear Conexiones Activas (2 min)

**Comando semanal:**
```bash
# Ver conexiones actuales
sudo -u postgres psql -c "
SELECT
    pid,
    usename,
    application_name,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE state IS NOT NULL
ORDER BY query_start;"

# Contar por aplicación
sudo -u postgres psql -c "
SELECT application_name, COUNT(*) as connections
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY application_name;"
```

**Valores normales:**
- Node.js backend: 5-10 conexiones
- Admin panel: 1-3 conexiones
- Total: <20 conexiones normales

**Si ves >50 conexiones:**
- ⚠️ Hay conexiones "colgadas" → Ir a TROUBLESHOOTING

---

### ACTIVIDAD 7: Validar Índices (2 min)

**Comando semanal:**
```bash
# Ver índices que NO están siendo usados
sudo -u postgres psql gallobets << 'EOF'
SELECT
    t.relname as table,
    i.relname as index,
    idx.idx_scan
FROM pg_class t
JOIN pg_index x ON t.oid = x.indrelid
JOIN pg_class i ON i.oid = x.indexrelid
LEFT JOIN pg_stat_user_indexes idx ON idx.indexrelname = i.relname
WHERE idx.idx_scan = 0
AND t.relname NOT LIKE 'pg_%'
ORDER BY t.relname;
EOF
```

**Qué buscar:**
- Si ves índices con `idx_scan = 0` → son innecesarios (pueden deletarse después, no urgente)
- Normal ver 1-5 índices no usados

---

## ⚠️ TROUBLESHOOTING RÁPIDO

### Problema: "Conexiones colgadas"
```bash
# Matar conexión específica
sudo -u postgres psql -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND state = 'idle'
  AND query_start < now() - interval '1 hour';"

# Matar TODAS las conexiones excepto la tuya
sudo -u postgres psql -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid();"
```

### Problema: "Disco casi lleno"
```bash
# Ver qué está ocupando espacio
sudo du -sh /var/lib/postgresql/*

# Opción 1: Limpiar logs viejos
sudo rm /var/log/postgresql/postgresql-*.log

# Opción 2: Comprimir logs
sudo find /var/log/postgresql -name "*.log" -exec gzip {} \;

# Opción 3: REINDEX (LENTO, 30-60 min)
sudo -u postgres psql gallobets -c "REINDEX DATABASE gallobets;"
```

### Problema: "PostgreSQL no inicia"
```bash
# Ver error específico
sudo systemctl status postgresql

# Ver logs detallados
sudo journalctl -u postgresql -n 50

# Intentar restart
sudo systemctl restart postgresql

# Si falla, comprobar integridad
sudo -u postgres pg_ctl -D /var/lib/postgresql/17/main status
```

### Problema: "Queries muy lentas"
```bash
# Ver queries más lentas actualmente
sudo -u postgres psql gallobets << 'EOF'
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
EOF

# Matar query que tarda mucho
# SELECT pg_terminate_backend(pid_number);
```

---

## 📊 CHECKLIST SEMANAL (Copia y pega)

```markdown
SEMANA DE: [FECHA]

[ ] Lunes 10:00 AM - Verificar salud del sistema
    - systemctl status postgresql
    - Ver conexiones activas
    - Ver tamaño BD

[ ] Lunes - Monitorear backups
    - ls -lh /var/backups/postgres/
    - Verificar backup reciente existe

[ ] Cualquier día - Monitorear espacio
    - df -h /
    - du -sh /var/lib/postgresql/

[ ] Cualquier día - Revisar logs
    - tail -100 postgresql.log | grep ERROR

[ ] Miércoles 2:00 AM - VACUUM ANALYZE
    - Ejecutado vía cron

[ ] Cualquier día - Conexiones
    - pg_stat_activity: <20 conexiones

[ ] Cualquier día - Índices
    - Ver índices no usados (informativo)

PROBLEMAS ENCONTRADOS: [NONE / LIST]
ACCIONES TOMADAS: [LIST]
```

---

## 🚨 MÉTRICAS CRÍTICAS A MONITOREAR (Escalabilidad 2025-11-20)

### Tabla de Monitoreo por Fase de Crecimiento

| Métrica | MVP <500u | Scaling 500-800u | Production 1000u | Trigger Upgrade |
|---------|-----------|------------------|------------------|-----------------|
| **CPU total (Nginx + PG)** | <40% ✅ | 40-70% ⚠️ | 70%+ 🔴 | At 70% sustained → Plan server upgrade |
| **Conexiones activas DB** | <20 ✅ | 20-50 ⚠️ | 50-200+ 🔴 | At max:20 → Plan PgBouncer OR upgrade |
| **Espacio disco libre** | >50% ✅ | 20-50% ⚠️ | <20% 🔴 | At 80% full → CRITICAL - Upgrade |
| **DB growth/semana** | +2-5% | +5-10% ⚠️ | +10%+ 🔴 | Monitor for exponential growth |
| **VACUUM duration** | <5 min ✅ | 5-10 min ⚠️ | >10 min 🔴 | If >10 min → REINDEX needed |
| **Disk I/O (IOPS)** | ~500 | 500-1000 ⚠️ | 1000+ 🔴 | Monitor SSD saturation |
| **PostgreSQL RAM** | 8-10GB | 10-16GB | 12-16GB | Scales with workload |
| **Network bandwidth** | 750 Mbps | 750-1500 Mbps | 1500+ Mbps | Phase 1B: Add Bunny CDN @ >750 Mbps |
| **Error logs/week** | 0-2 | 3-5 ⚠️ | 5+ 🔴 | Investigate error patterns |
| **Backup integrity** | Monthly test | Monthly test | Weekly test | Always verify restore |

---

## 📈 ESCALABILIDAD: TRIGGERES PARA UPGRADE (2025-11-20)

### PHASE 1B: Agregar Bunny CDN (Months 5-6, if reaching 750 Mbps)

**Trigger signals (PHASE 1B):**
- ✅ Nginx server CPU >60% constantly
- ✅ Network bandwidth output >500 Mbps average
- ✅ Latency for users >200ms in other regions
- ✅ GalloBets approaching 600+ concurrent users

**When Phase 1B triggered:**
1. Agregar Bunny CDN Pull Zone ($108-216/mo)
2. Apuntar Bunny a tu servidor Nginx
3. Video.js descarga desde Bunny en lugar de Nginx
4. Tu Nginx solo ve tráfico de Bunny (no direct user connections)

**Cost at Phase 1B:** $155-195 (server) + $108-216 (CDN) = **$263-411/mo**

**Impact:** Servidor dedicado $155-195 sigue siendo suficiente (solo Nginx genera HLS)

---

### PHASE 2A: Server Upgrade (Months 6+, if 3 triggers hit)

**CRITICAL: Plan upgrade BEFORE hitting these simultaneously:**

| Trigger | Threshold | Action | Timeline |
|---------|-----------|--------|----------|
| **CPU saturation** | Nginx + PostgreSQL > 70% sustained for 1 week | Start upgrade planning, 2-week lead time | 🔴 PLAN immediately |
| **Disk space** | Free space < 20% (< 100GB on 500GB disk) | 🔴 CRITICAL - Upgrade within 48h OR move HLS to S3 | 🔴 URGENT |
| **Connection pool** | Database connections at max:20 consistently | Add PgBouncer ($50-100/mo) OR plan full upgrade | ⚠️ WARN |

**Server Upgrade Path:**
- **Current:** 8-core, 32GB RAM, 500GB SSD = $155-195/mo
- **Upgrade to:** 16-core, 64GB RAM, 2TB SSD = $400-500/mo
- **Migration time:** 2-4 hours (backup → restore → DNS switch)
- **Downtime:** < 30 minutes
- **Total cost Phase 2:** $400-500 (server) + $108-216 (CDN) = **$508-716/mo**

**At 16-core, 64GB, 2TB you support 1000+ concurrent users:**
- 16 cores = 2× headroom (CPU only reaches 50% under load)
- 64GB RAM = PostgreSQL unlimited buffers
- 2TB SSD = 12+ months of data growth

---

### PHASE 2B: PgBouncer (Emergency intermediate, if pool exhausted but CPU <70%)

**When to use PgBouncer ONLY:**
- Connection pool maxed at 20
- CPU is still <70% (not saturated)
- Need quick fix before full server upgrade

**What PgBouncer does:**
- ✅ Solves connection pool bottleneck
- ❌ Does NOT solve CPU saturation
- ❌ Does NOT solve disk space filling
- Extends current server to ~800 users max (still needs Phase 2A upgrade @ 1000 users)

**Cost:** $50-100/mo (separate VPS for pooling proxy)

---

### PHASE 2C: Revisit Neon.tech (Alternative path if maintenance burden)

**Alternative to server upgrade:**
- Keep Nginx RTMP local ($155-195/mo)
- Move PostgreSQL to Neon.tech ($50-100/mo) managed
- Keep Bunny CDN ($108-216/mo)
- **Total:** $313-511/mo

**Trade-off:**
- Costs $50-200/mo MORE than local PostgreSQL
- BUT: Eliminates 30 min/week maintenance
- AND: Scales to 1000+ without server upgrade
- AND: 99.99% SLA + automatic failover

**Decision criteria:** If maintenance becomes burden OR if rapid growth beyond 800 users predicted

---

## 💡 AUTOMATIZACIÓN RECOMENDADA

**Ya configurado (cron):**
- ✅ Backup automático: domingo 23:00
- ✅ VACUUM ANALYZE: miércoles 02:00

**Opcional (si quieres monitoreo avanzado):**
```bash
# Instalar Prometheus para PostgreSQL
sudo apt install prometheus-postgres-exporter

# Configurar Grafana para dashboards
# (Pero para MVP, cron + checklist semanal es suficiente)
```

---

## 📞 RESUMEN FINAL: MANTENIMIENTO + ESCALABILIDAD (2025-11-20)

### MANTENIMIENTO SEMANAL: 30 minutos

1. **Verificar salud** (5 min)
   - systemctl status postgresql
   - Ver conexiones activas
   - Ver tamaño BD

2. **Monitorear backups** (3 min)
   - ls -lh /var/backups/postgres/
   - Verificar backup reciente existe

3. **Espacio en disco** (2 min)
   - df -h /
   - du -sh /var/lib/postgresql/

4. **Revisar logs** (3 min)
   - tail -100 postgresql.log | grep ERROR

5. **VACUUM** (automatizado vía cron)
   - Miércoles 02:00 AM

6. **Conexiones activas** (2 min)
   - pg_stat_activity: comparar contra tabla de límites

7. **Índices** (2 min)
   - Ver índices no usados (informativo)

### MONITOREO PARA ESCALABILIDAD

**Comparar semanalmente contra tabla de MÉTRICAS CRÍTICAS (línea 340+):**

- Si **CPU > 70%:** 🔴 Start server upgrade planning (2-week lead time)
- Si **Conexiones > 20 máx:** ⚠️ Plan PgBouncer OR upgrade
- Si **Disco < 20% libre:** 🔴 CRITICAL - Upgrade within 48h

**Phase 1 (MVP):**
- Monitor CPU: target <40%
- Monitor pool: target <20 connections
- Monitor disk: target >50% free

**Phase 1B (Add CDN @ 750 Mbps):**
- Bunny CDN triggered: CPU >60%
- Cost: +$108-216/mo

**Phase 2A (Server upgrade @ 800 users):**
- CPU > 70% sustained OR disk <20% free OR pool exhausted
- Upgrade to: 16-core, 64GB, 2TB = $400-500/mo
- Downtime: < 30 min

**Phase 2C (Alternative: use Neon.tech):**
- If maintenance becomes burden
- Cost: +$50-100/mo (more than local, but managed)

---

## ✅ DOCUMENTACIÓN ACTUALIZADA (2025-11-20)

**Archivos actualizados con análisis de escalabilidad:**
- ✅ `brain/sdd_system.json` - Escalability section + upgrade triggers
- ✅ `brain/prd_system.json` - Cost/phase breakdown for all 3 scenarios
- ✅ `postgresql-local-maintenance-manual.md` - Metrics + triggers + alternatives

**Plan actual:**
- ✅ PostgreSQL local PERMANENT (no Neon.tech unless maintenance becomes burden)
- ✅ Weekly monitoring checklist embedded
- ✅ Clear upgrade triggers (CPU, disk, connections)
- ✅ Cost projections for all phases (Phase 1 → Phase 3)

---
