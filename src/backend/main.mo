import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";



actor {
  type Task = {
    id : Nat;
    text : Text;
    completed : Bool;
    createdAt : Int;
  };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Nat.compare(task1.id, task2.id);
    };
  };

  type Streak = {
    lastStudyDay : Int;
    currentStreak : Nat;
  };

  type Session = {
    date : Int;
    durationMinutes : Nat;
  };

  // Internal State
  let userTasks = Map.empty<Principal, List.List<Task>>();
  let userStreaks = Map.empty<Principal, Streak>();
  let userSessions = Map.empty<Principal, List.List<Session>>();

  func dayFromTimestamp(timestamp : Int) : Int {
    timestamp / (1000 * 60 * 60 * 24);
  };

  func randomId() : Nat {
    Int.abs(Time.now());
  };

  // TO-DO LIST
  public shared ({ caller }) func addTask(text : Text) : async () {
    let task : Task = {
      id = randomId();
      text;
      completed = false;
      createdAt = Int.abs(Time.now());
    };

    let currentTasks = switch (userTasks.get(caller)) {
      case (null) { List.empty<Task>() };
      case (?tasks) { tasks };
    };

    currentTasks.add(task);
    userTasks.add(caller, currentTasks);
  };

  public shared ({ caller }) func toggleTaskComplete(taskId : Nat) : async () {
    let currentTasks = switch (userTasks.get(caller)) {
      case (null) { Runtime.trap("Task not found") };
      case (?tasks) { tasks };
    };

    let updatedTasks = currentTasks.map<Task, Task>(
      func(task) {
        if (task.id == taskId) {
          { task with completed = not task.completed };
        } else {
          task;
        };
      }
    );

    userTasks.add(caller, updatedTasks);
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    switch (userTasks.get(caller)) {
      case (null) {
        Runtime.trap("No tasks found for user");
      };
      case (?tasks) {
        let filteredTasks = tasks.filter(
          func(task) {
            task.id != taskId;
          }
        );
        userTasks.add(caller, filteredTasks);
      };
    };
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    switch (userTasks.get(caller)) {
      case (null) { [] };
      case (?tasks) { tasks.toArray() };
    };
  };

  // STREAK COUNTER & SESSION HISTORY
  public shared ({ caller }) func completeStudySession(durationMinutes : Nat) : async () {
    let now = Time.now();
    let today = dayFromTimestamp(now);

    let currentStreak = switch (userStreaks.get(caller)) {
      case (null) {
        { lastStudyDay = today; currentStreak = 1 };
      };
      case (?streak) {
        let daysDifference = today - streak.lastStudyDay;
        if (daysDifference == 1) {
          { lastStudyDay = today; currentStreak = streak.currentStreak + 1 };
        } else if (daysDifference > 1) {
          { lastStudyDay = today; currentStreak = 1 };
        } else {
          streak;
        };
      };
    };

    userStreaks.add(caller, currentStreak);

    let session : Session = {
      date = now;
      durationMinutes;
    };

    let currentSessions = switch (userSessions.get(caller)) {
      case (null) { List.empty<Session>() };
      case (?sessions) { sessions };
    };

    currentSessions.add(session);
    userSessions.add(caller, currentSessions);
  };

  public query ({ caller }) func getCurrentStreak() : async Nat {
    switch (userStreaks.get(caller)) {
      case (null) { 0 };
      case (?streak) { streak.currentStreak };
    };
  };

  public query ({ caller }) func getSessionHistory() : async [Session] {
    switch (userSessions.get(caller)) {
      case (null) { [] };
      case (?sessions) { sessions.toArray() };
    };
  };
};
