/*  This service is used to get the notification limit for the provided categories from the n8n notification limit webhook. 
    The notification limit is the maximum expected number of notifications for the provided categories. 
    The categories are provided as an array of objects with the slug and level of the category. 
    The service makes a POST request to the n8n webhook with the categories and returns the maxDealsPerDay value from the response. 
    If the request fails, an error is thrown. 
*/
export const NotificationLimitService = {
  async getNotificationLimit(categories: { slug: string; level: number }[]) {
    const res = await fetch(
      process.env.NEXT_PUBLIC_NOTIFICATION_LIMIT_WEBHOOK_URL ?? '',
      {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(categories)
      }
    );

    if (!res.ok) {
      console.log('Error in getNotificationLimit', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();

    return data.maxDealsPerDay;
  }
};
