import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, Task } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCurrentStreak() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["streak"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCurrentStreak();
    },
    enabled: !!actor && !isFetching,
  });
}

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "Hard work beats talent when talent doesn't work hard. — Tim Notke",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "In the middle of difficulty lies opportunity. — Albert Einstein",
  "Education is the most powerful weapon you can use to change the world. — Nelson Mandela",
  "An investment in knowledge pays the best interest. — Benjamin Franklin",
  "The more that you read, the more things you will know. — Dr. Seuss",
  "Learning never exhausts the mind. — Leonardo da Vinci",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Stay focused and never give up.",
  "Discipline is choosing between what you want now and what you want most.",
];

function getRandomQuoteLocal(currentQuote?: string): string {
  const available = currentQuote
    ? MOTIVATIONAL_QUOTES.filter((q) => q !== currentQuote)
    : MOTIVATIONAL_QUOTES;
  return available[Math.floor(Math.random() * available.length)];
}

export function useGetRandomQuote() {
  return useQuery<string>({
    queryKey: ["quote"],
    queryFn: async () => getRandomQuoteLocal(),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}

export function useGetSessionHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.addTask(text);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useToggleTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.toggleTaskComplete(taskId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTask(taskId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCompleteStudySession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (durationMinutes: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.completeStudySession(durationMinutes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["streak"] });
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useAskQuestion() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (question: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.askQuestion(question);
    },
  });
}
