import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    id: bigint;
    createdAt: bigint;
    text: string;
    completed: boolean;
}
export interface Session {
    date: bigint;
    durationMinutes: bigint;
}
export interface backendInterface {
    addTask(text: string): Promise<void>;
    completeStudySession(durationMinutes: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    getAllTasks(): Promise<Array<Task>>;
    getCurrentStreak(): Promise<bigint>;
    getSessionHistory(): Promise<Array<Session>>;
    toggleTaskComplete(taskId: bigint): Promise<void>;
}
