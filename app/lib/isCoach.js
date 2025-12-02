// Check if user is the coach (you can set this email in .env)
export function isCoachEmail(email) {
  // For testing - use your test email here
  // Change this to production email later: therese@tngolf.se
  const coachEmail = process.env.COACH_EMAIL || 'test@example.com';
  return email === coachEmail;
}

