interface ContactFormEmailProps {
  name: string;
  email: string;
  message: string;
}

function ContactFormEmail({ name, email, message }: ContactFormEmailProps) {
  return (
  <div>
    <p>Hey {name},</p>
    <p>
      <strong>Your Email:</strong>
    </p>
    <p>{email}</p>
    <p>
      <strong>Your Message:</strong>
    </p>
    <p>{message}</p>
    <hr />
    <p>Thank you for your message, {name}! I will reply as soon as I can.</p>
    <p>&copy; 2026 connorhyatt.com</p>
  </div>
  );
}

export default ContactFormEmail;
