import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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

  type AIResponse = {
    keywords : [Text];
    response : Text;
  };

  // Internal State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userTasks = Map.empty<Principal, List.List<Task>>();
  let userStreaks = Map.empty<Principal, Streak>();
  let userSessions = Map.empty<Principal, List.List<Session>>();
  let motivationalQuotes = List.empty<Text>();
  let aiResponses = List.empty<AIResponse>();

  func dayFromTimestamp(timestamp : Int) : Int {
    timestamp / (1000 * 60 * 60 * 24);
  };

  // ID Helper Function
  func randomId() : Nat {
    Int.abs(Time.now());
  };

  // MOTIVATIONAL QUOTES
  public query ({ caller }) func getRandomQuote() : async Text {
    if (motivationalQuotes.isEmpty()) {
      Runtime.trap("No motivational quotes available");
    };
    let randomIndex = randomId() % motivationalQuotes.size();
    motivationalQuotes.at(randomIndex);
  };

  // TO-DO LIST
  public shared ({ caller }) func addTask(text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add tasks");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle tasks");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    switch (userTasks.get(caller)) {
      case (null) { [] };
      case (?tasks) { tasks.toVarArray().sort().toArray() };
    };
  };

  // STREAK COUNTER & SESSION HISTORY
  public shared ({ caller }) func completeStudySession(durationMinutes : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete sessions");
    };

    // Streak Update
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

    // Session History
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view streaks");
    };

    switch (userStreaks.get(caller)) {
      case (null) { 0 };
      case (?streak) { streak.currentStreak };
    };
  };

  public query ({ caller }) func getSessionHistory() : async [Session] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view session history");
    };

    switch (userSessions.get(caller)) {
      case (null) { [] };
      case (?sessions) { sessions.toVarArray().toArray() };
    };
  };

  // AI Q&A
  public query ({ caller }) func askQuestion(question : Text) : async Text {
    let normalizedQuestion = question.toLower();

    for (aiResponse in aiResponses.values()) {
      for (keyword in aiResponse.keywords.values()) {
        if (normalizedQuestion.contains(#text(keyword))) {
          return aiResponse.response;
        };
      };
    };

    "I'm sorry, I don't have a specific answer for that. Remember to stay focused and keep learning!";
  };
};
