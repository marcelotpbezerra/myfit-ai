"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Identificadores consistentes para o sistema
export const NOTIFICATION_CATEGORIES = {
    WORKOUT_REST: "WORKOUT_REST",
    WORKOUT_SET: "WORKOUT_SET",   // Nova: exibe série atual no relógio
};

export const NOTIFICATION_ACTIONS = {
    SKIP_REST: "SKIP_REST",
    OPEN_APP: "OPEN_APP",
    START_NEXT_SET: "START_NEXT_SET",
    SUBTRACT_10S: "SUBTRACT_10S",
    MARK_SET_DONE: "MARK_SET_DONE", // Nova: marca série como feita direto do relógio
};

// IDs fixos para notificações gerenciadas
const NOTIF_ID_REST = 1001;
const NOTIF_ID_WORKOUT_SET = 1002;
const NOTIF_ID_REST_LIVE = 1003;
const NOTIF_ID_DUCKING = 999;

export const NotificationService = {
    async requestPermissions() {
        if (!Capacitor.isNativePlatform()) {
            if (!("Notification" in window)) return false;
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
        const { display } = await LocalNotifications.requestPermissions();
        return display === "granted";
    },

    async init() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // 1. Criar Canal para Android (Alta Importância para Timers)
            await LocalNotifications.createChannel({
                id: "workout",
                name: "Treino e Descanso",
                description: "Notificações de timer e descanso de treino",
                importance: 5, // IMPORTANCE_HIGH — garante aparição no WearOS
                visibility: 1,
                vibration: true,
            });

            // 2. Registrar Categorias e Ações (WearOS / Apple Watch)
            await LocalNotifications.registerActionTypes({
                types: [
                    // --- Descanso entre séries ---
                    {
                        id: NOTIFICATION_CATEGORIES.WORKOUT_REST,
                        actions: [
                            {
                                id: NOTIFICATION_ACTIONS.START_NEXT_SET,
                                title: "▶️ Iniciar Série",
                                foreground: true, // Traz o app pro primeiro plano
                            },
                            {
                                id: NOTIFICATION_ACTIONS.SUBTRACT_10S,
                                title: "⏩ -10s",
                                foreground: false, // Executa em background
                            }
                        ]
                    },
                    // --- Série em execução (novo para WearOS) ---
                    {
                        id: NOTIFICATION_CATEGORIES.WORKOUT_SET,
                        actions: [
                            {
                                id: NOTIFICATION_ACTIONS.MARK_SET_DONE,
                                title: "✅ Marcar Feita",
                                foreground: true, // Traz o app para registrar e exibir timer
                            }
                        ]
                    }
                ]
            });

            // 3. Listener Global de Ações (dispatch de eventos para os componentes)
            LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
                const { actionId } = notificationAction;

                console.log(`[NotificationService] Ação Recebida: ${actionId}`);

                // Dispara evento global para componentes ouvirem
                if (Object.values(NOTIFICATION_ACTIONS).includes(actionId)) {
                    window.dispatchEvent(new CustomEvent(`notification:${actionId.toLowerCase()}`));
                }
            });

            console.log("NotificationService: Canais e Categorias inicializados.");
        } catch (e) {
            console.error("Erro ao inicializar NotificationService:", e);
        }
    },

    // ─── Notificação de fim de descanso ───────────────────────────────────────

    async scheduleRestNotification(
        seconds: number,
        context?: {
            exerciseName?: string;
            nextSetNumber?: number;
            totalSets?: number;
            targetWeight?: string | null;
            targetReps?: number | null;
        }
    ) {
        const nextInfo = context?.exerciseName
            ? ` — ${context.exerciseName} (Série ${context.nextSetNumber ?? "?"}/${context.totalSets ?? "?"})`
            : "";

        if (!Capacitor.isNativePlatform()) {
            if ("Notification" in window && Notification.permission === "granted") {
                setTimeout(() => {
                    new Notification("🔥 Descanso Finalizado!", {
                        body: nextInfo
                            ? `Próximo: ${context!.exerciseName} — Série ${context!.nextSetNumber}/${context!.totalSets}`
                            : "Hora da próxima série. Vamos pra cima!",
                        icon: "/icons/icon-192x192.png",
                        tag: "rest-timer"
                    });
                }, seconds * 1000);
            }
            return;
        }

        // Remove contador "vivo" se existir ao agendar o alerta final
        await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID_REST_LIVE }] }).catch(() => {});

        const scheduleDate = new Date(Date.now() + seconds * 1000);
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "🔥 Descanso Finalizado!",
                    body: nextInfo
                        ? `Próximo: ${context!.exerciseName} — Série ${context!.nextSetNumber}/${context!.totalSets}`
                        : "Hora da próxima série. Vamos pra cima!",
                    id: NOTIF_ID_REST,
                    schedule: { at: scheduleDate },
                    sound: "beep.wav",
                    channelId: "workout",
                    actionTypeId: NOTIFICATION_CATEGORIES.WORKOUT_REST,
                    extra: { type: "rest_finish", ...context }
                }
            ]
        });
    },

    /**
     * Atualiza uma notificação "viva" no relógio com o tempo restante.
     * Chamada periodicamente pelo componente RestTimer.
     */
    async updateLiveRestTimer(
        seconds: number,
        context?: {
            exerciseName?: string;
            nextSetNumber?: number;
            totalSets?: number;
        }
    ) {
        if (!Capacitor.isNativePlatform()) return;

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const title = `⏱️ Descanso: ${timeStr}`;
        const body = context?.exerciseName
            ? `Próximo: ${context.exerciseName} (${context.nextSetNumber}/${context.totalSets})`
            : "Prepare-se para a próxima série!";

        // Cancela a anterior antes de reagendar — mesmo padrão do scheduleWorkoutSetNotification
        // Sem isso, o Android ignora o re-schedule do mesmo ID já entregue
        await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID_REST_LIVE }] }).catch(() => {});

        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: NOTIF_ID_REST_LIVE,
                    schedule: { at: new Date(Date.now() + 150) }, // 150ms — mesmo buffer do set notification
                    channelId: "workout",
                    actionTypeId: NOTIFICATION_CATEGORIES.WORKOUT_REST,
                    extra: { type: "rest_live", ...context }
                }
            ]
        });
    },

    /** Remove todas as notificações de descanso (viva e final) */
    async cancelRestNotifications() {
        if (!Capacitor.isNativePlatform()) return;
        await LocalNotifications.cancel({
            notifications: [
                { id: NOTIF_ID_REST },
                { id: NOTIF_ID_REST_LIVE }
            ]
        }).catch(() => {});
    },

    // ─── Notificação de série em execução (exibida no WearOS) ─────────────────

    /**
     * Exibe no relógio os dados da série atual com botão "✅ Marcar Feita".
     * Substitui qualquer notificação de série anterior.
     */
    async scheduleWorkoutSetNotification(params: {
        exerciseName: string;
        muscleGroup?: string | null;
        setNumber: number;
        totalSets: number;
        targetWeight?: string | null;
        targetReps?: number | null;
    }) {
        const { exerciseName, muscleGroup, setNumber, totalSets, targetWeight, targetReps } = params;

        const setInfo = targetWeight && targetReps
            ? `${targetWeight}kg × ${targetReps} reps`
            : targetReps
            ? `${targetReps} reps`
            : "Execute a série";

        const title = `💪 ${exerciseName}`;
        const body = `Série ${setNumber}/${totalSets} • ${setInfo}${muscleGroup ? ` • ${muscleGroup}` : ""}`;

        if (!Capacitor.isNativePlatform()) {
            // Web: apenas exibe uma notificação informativa sem ações interativas
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, {
                    body,
                    icon: "/icons/icon-192x192.png",
                    tag: "workout-set",
                    // Web não suporta action buttons, mas o badge ajuda na UX
                    badge: "/icons/icon-192x192.png",
                } as NotificationOptions);
            }
            return;
        }

        // Cancela notificação de série anterior antes de enviar nova
        await LocalNotifications.cancel({
            notifications: [{ id: NOTIF_ID_WORKOUT_SET }]
        }).catch(() => {});

        // Agenda notificação imediata (100ms de delay para garantir o cancelamento anterior)
        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: NOTIF_ID_WORKOUT_SET,
                    schedule: { at: new Date(Date.now() + 150) },
                    channelId: "workout",
                    actionTypeId: NOTIFICATION_CATEGORIES.WORKOUT_SET,
                    extra: { type: "workout_set", ...params }
                }
            ]
        });
    },

    /** Remove a notificação de série atual (ao terminar o exercício ou o treino) */
    async cancelWorkoutSetNotification() {
        if (!Capacitor.isNativePlatform()) return;
        await LocalNotifications.cancel({
            notifications: [{ id: NOTIF_ID_WORKOUT_SET }]
        }).catch(() => {});
    },
};

// Funções para manter compatibilidade com componentes que importam diretamente
export const initNotifications = () => NotificationService.init();
export const scheduleRestNotification = (s: number, ctx?: Parameters<typeof NotificationService.scheduleRestNotification>[1]) =>
    NotificationService.scheduleRestNotification(s, ctx);
