export interface RoomSettings {
    questionFilter: QuestionFilter;
    duration?: number | null;
    difficulty: RoomDifficulty;
}

export interface RoomDifficulty {
    Easy: boolean;
    Medium: boolean;
    Hard: boolean;
}

export interface QuestionFilter {
    kind: QuestionFilterKind;
    selections: {
        topics: string[];
        questions: string[];
    };
}

export enum QuestionFilterKind {
    Topics = "topics",
    Questions = "questions",
}

export const topics = [
    "Array",
    "Backtracking",
    "Biconnected Component",
    "Binary Indexed Tree",
    "Binary Search",
    "Binary Search Tree",
    "Binary Tree",
    "Bit Manipulation",
    "Bitmask",
    "Brainteaser",
    "Breadth-First Search",
    "Bucket Sort",
    "Combinatorics",
    "Concurrency",
    "Counting",
    "Counting Sort",
    "Data Stream",
    "Database",
    "Depth-First Search",
    "Design",
    "Divide and Conquer",
    "Doubly-Linked List",
    "Dynamic Programming",
    "Enumeration",
    "Eulerian Circuit",
    "Game Theory",
    "Geometry",
    "Graph",
    "Greedy",
    "Hash Function",
    "Hash Table",
    "Heap (Priority Queue)",
    "Interactive",
    "Iterator",
    "Line Sweep",
    "Linked List",
    "Math",
    "Matrix",
    "Memoization",
    "Merge Sort",
    "Minimum Spanning Tree",
    "Monotonic Queue",
    "Monotonic Stack",
    "Number Theory",
    "Ordered Set",
    "Prefix Sum",
    "Probability and Statistics",
    "Queue",
    "Quickselect",
    "Radix Sort",
    "Randomized",
    "Recursion",
    "Rejection Sampling",
    "Reservoir Sampling",
    "Rolling Hash",
    "Segment Tree",
    "Shell",
    "Shortest Path",
    "Simulation",
    "Sliding Window",
    "Sorting",
    "Stack",
    "String",
    "String Matching",
    "Strongly Connected Component",
    "Suffix Array",
    "Topological Sort",
    "Tree",
    "Trie",
    "Two Pointers",
    "Union Find",
];

const defaultQuestions = ["two-sum"];

export const defaultRoomSettings: RoomSettings = {
    questionFilter: {
        kind: QuestionFilterKind.Topics,
        selections: {
            topics,
            questions: defaultQuestions,
        },
    },
    duration: null,
    difficulty: {
        Easy: true,
        Medium: true,
        Hard: true,
    },
};
