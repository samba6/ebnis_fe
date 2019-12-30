export function cleanupObservableSubscription(
  subscription: ZenObservable.Subscription,
) {
  subscription.unsubscribe();
}
