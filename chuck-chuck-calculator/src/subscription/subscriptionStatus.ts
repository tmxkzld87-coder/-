// subscriptionStatus.ts
//
// 플레이스홀더 — 아직 인앱결제(IAP) 연동이 안 돼 있어서 항상 false를
// 반환한다. 실제 구독 상품이 콘솔에 등록되고 @apps-in-toss/framework의
// IAP.getSubscriptionInfo를 쓸 수 있게 되면, 여기서 마지막 구매의
// orderId로 구독 상태(status === 'ACTIVE' && isAccessible)를 조회해
// 반환하도록 바꿔야 한다. 그 전까지는 모든 사용자가 무료 등급이다.
export async function isSubscribed(): Promise<boolean> {
  return false;
}
