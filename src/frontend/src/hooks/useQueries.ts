import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// Stub hooks — backend methods not yet implemented
export function useGetAllTasks() {
  return useQuery<unknown[]>({ queryKey: ["tasks"], queryFn: async () => [] });
}

export function useGetCurrentStreak() {
  return useQuery<bigint>({
    queryKey: ["streak"],
    queryFn: async () => BigInt(0),
  });
}

export function useGetSessionHistory() {
  return useQuery<unknown[]>({
    queryKey: ["sessions"],
    queryFn: async () => [],
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_text: string) => {},
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_taskId: bigint) => {},
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_taskId: bigint) => {},
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCompleteStudySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_durationMinutes: bigint) => {},
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["streak"] });
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useAskQuestion() {
  return useMutation({
    mutationFn: async (_question: string): Promise<string> => {
      return "Answer not available — backend not connected.";
    },
  });
}
