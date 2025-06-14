import React, { useState } from "react";
import type { JSX } from "react";
import {
  AlertTriangle,
  RefreshCcw,
  Video,
  WifiOff,
  PauseCircle,
  PlayCircle,
  Settings,
  Activity,
  Terminal,
  Zap,
  ShieldAlert,
} from "lucide-react";
import Modal from "../shared/Modal";

const TABS = [
  { key: "transmision", label: "Transmisión" },
  { key: "streaming", label: "Streaming" },
  { key: "conexion", label: "Conexión" },
  { key: "general", label: "General" },
];

const ISSUES = {
  transmision: [
    {
      icon: <Video className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />,
      title: "No hay imagen o video congelado",
      steps: [
        "Verifica que OBS esté transmitiendo correctamente.",
        "Reinicia la transmisión desde OBS.",
        "Comprueba la conexión de red del equipo de transmisión.",
        "Si el problema persiste, usa el botón 'Reiniciar transmisión'.",
      ],
    },
    {
      icon: <RefreshCcw className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />,
      title: "Retraso excesivo en la transmisión",
      steps: [
        "Reduce la calidad de video en OBS (ej. 480p).",
        "Verifica la estabilidad de la conexión a internet.",
        "Considera cambiar a la conexión de respaldo si está disponible.",
      ],
    },
  ],
  streaming: [
    {
      icon: <Settings className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0" />,
      title: "Calidad de video baja",
      steps: [
        "Ajusta el bitrate en OBS a 1500-2500 kbps.",
        "Verifica que no haya otros programas consumiendo ancho de banda.",
        "Cambia la calidad usando el botón 'Cambiar calidad'.",
      ],
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />,
      title: "Buffering frecuente",
      steps: [
        "Reduce la resolución de salida en OBS.",
        "Verifica la velocidad de subida de internet.",
        "Activa la conexión de respaldo si es necesario.",
      ],
    },
  ],
  conexion: [
    {
      icon: <WifiOff className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />,
      title: "Desconexión de internet",
      steps: [
        "Verifica cables y router.",
        "Cambia a la red de respaldo si está disponible.",
        "Reinicia el router si es seguro hacerlo.",
      ],
    },
    {
      icon: <Activity className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />,
      title: "Latencia alta",
      steps: [
        "Cierra aplicaciones innecesarias en el equipo de transmisión.",
        "Verifica la calidad de la red local.",
        "Considera pausar el evento si la latencia es crítica.",
      ],
    },
  ],
  general: [
    {
      icon: (
        <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" />
      ),
      title: "Problema no identificado",
      steps: [
        "Consulta los logs de transmisión abajo.",
        "Contacta al soporte técnico si el problema persiste.",
      ],
    },
  ],
};

const QUICK_ACTIONS = [
  {
    label: "Reiniciar transmisión",
    icon: <RefreshCcw className="w-5 h-5 mr-2" />,
    action: "restart",
    color: "bg-blue-100 text-blue-700",
  },
  {
    label: "Cambiar calidad",
    icon: <Settings className="w-5 h-5 mr-2" />,
    action: "quality",
    color: "bg-gray-100 text-gray-700",
  },
  {
    label: "Conexión de respaldo",
    icon: <WifiOff className="w-5 h-5 mr-2" />,
    action: "backup",
    color: "bg-green-100 text-green-700",
  },
  {
    label: "Pausar evento",
    icon: <PauseCircle className="w-5 h-5 mr-2" />,
    action: "pause",
    color: "bg-amber-100 text-amber-700",
  },
  {
    label: "Reanudar evento",
    icon: <PlayCircle className="w-5 h-5 mr-2" />,
    action: "resume",
    color: "bg-green-100 text-green-700",
  },
];

const EMERGENCY_BTN = {
  label: "Emergencia: Detener Todo",
  icon: <ShieldAlert className="w-5 h-5 mr-2" />,
  color: "bg-red-600 text-white hover:bg-red-700",
};

const TechnicalIssuesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof ISSUES>(
    TABS[0].key as keyof typeof ISSUES
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [emergencyConfirm, setEmergencyConfirm] = useState(false);

  const handleQuickAction = (action: string) => {
    let msg = "";
    switch (action) {
      case "restart":
        msg = "[LOG] Transmisión reiniciada por el operador.";
        break;
      case "quality":
        msg = "[LOG] Calidad de streaming ajustada.";
        break;
      case "backup":
        msg = "[LOG] Conexión de respaldo activada.";
        break;
      case "pause":
        msg = "[LOG] Evento pausado.";
        break;
      case "resume":
        msg = "[LOG] Evento reanudado.";
        break;
    }
    if (msg) setLogs((prev) => [msg, ...prev].slice(0, 10));
  };

  const handleEmergency = () => {
    setEmergencyConfirm(true);
    setTimeout(() => setEmergencyConfirm(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
      <div className="flex items-center mb-4">
        <Terminal className="w-5 h-5 text-gray-500 mr-2" />
        <h2 className="font-bold text-gray-900 text-lg">
          Soporte Técnico Rápido
        </h2>
      </div>
      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as keyof typeof ISSUES)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none ${
              activeTab === tab.key
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Problemas comunes */}
      <div id={`tabpanel-${activeTab}`} className="mb-4">
        {ISSUES[activeTab].map(
          (
            issue: { icon: JSX.Element; title: string; steps: string[] },
            idx: number
          ) => (
            <div key={idx} className="mb-4">
              <div className="flex items-center mb-1">
                {issue.icon}
                <span className="font-medium text-gray-900">{issue.title}</span>
              </div>
              <ol className="list-decimal list-inside text-sm text-gray-700 ml-7">
                {issue.steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )
        )}
      </div>
      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.action}
            onClick={() => handleQuickAction(action.action)}
            className={`flex items-center px-3 py-1.5 rounded-lg font-medium text-sm focus:outline-none ${action.color}`}
            aria-label={action.label}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      {/* Logs básicos */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto border border-gray-100">
        <div className="flex items-center mb-2">
          <Activity className="w-4 h-4 text-gray-400 mr-1" />
          <span className="text-xs text-gray-500">Logs de transmisión</span>
        </div>
        <ul className="text-xs text-gray-700 space-y-1">
          {logs.length === 0 ? (
            <li className="text-gray-400">Sin logs recientes.</li>
          ) : (
            logs.map((log, i) => <li key={i}>{log}</li>)
          )}
        </ul>
      </div>
      {/* Botón de emergencia */}
      <div className="flex justify-end">
        <button
          onClick={handleEmergency}
          className={`flex items-center px-4 py-2 rounded-lg font-bold shadow ${EMERGENCY_BTN.color} focus:outline-none`}
          aria-label={EMERGENCY_BTN.label}
        >
          {EMERGENCY_BTN.icon}
          {emergencyConfirm ? "¡Emergencia confirmada!" : EMERGENCY_BTN.label}
        </button>
      </div>
      {/* Modal de emergencia */}
      {emergencyConfirm && (
        <Modal
          title="Confirmación de Emergencia"
          isOpen={emergencyConfirm}
          onClose={() => setEmergencyConfirm(false)}
        >
          <div className="text-red-600 font-bold mb-4">
            ¡Emergencia confirmada! Se han detenido todos los procesos.
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setEmergencyConfirm(false)}
          >
            Cerrar
          </button>
        </Modal>
      )}
    </div>
  );
};

export default TechnicalIssuesPanel;
