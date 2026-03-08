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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTask(text: string): Promise<void>;
    askQuestion(question: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeStudySession(durationMinutes: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentStreak(): Promise<bigint>;
    getRandomQuote(): Promise<string>;
    getSessionHistory(): Promise<Array<Session>>;
    isCallerAdmin(): Promise<boolean>;
    toggleTaskComplete(taskId: bigint): Promise<void>;
}
