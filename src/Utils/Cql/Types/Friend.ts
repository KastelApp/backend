interface FriendsInteractions {
    Flags: number;
    TargetId: string;
    TargetNickname: string;
    UserId: string;
}

interface Friends {
    FriendId: string;
    Interactions: FriendsInteractions[];
    Users: string[];
}

export default Friends;

export type { FriendsInteractions };
