export type EventType = 'wedding' | 'funeral' | 'firstBirthday';

export type Relationship =
  | 'family'
  | 'relative'
  | 'closeFriend'
  | 'friend'
  | 'coworker'
  | 'acquaintance'
  | 'business';

export type Intimacy = 'close' | 'normal' | 'light';

export type Attendance = 'attending' | 'notAttending';

export type MealChoice = 'withMeal' | 'withoutMeal';

export interface Answers {
  eventType: EventType;
  relationship: Relationship;
  intimacy: Intimacy;
  attendance: Attendance;
  meal: MealChoice;
}

export type ComparisonResult = 'appropriate' | 'slightlyLess' | 'generous';

export type ReceivedRelationship = 'friend' | 'relative' | 'coworker' | 'other';
