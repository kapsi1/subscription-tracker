import axios from 'axios';

export class MailpitHelper {
  private static readonly MAILPIT_API = 'http://localhost:8025/api/v1';

  static async clearMessages() {
    try {
      await axios.delete(`${this.MAILPIT_API}/messages`);
    } catch (error) {
      console.error('Failed to clear Mailpit messages:', error.message);
    }
  }

  static async getMessages() {
    try {
      const response = await axios.get(`${this.MAILPIT_API}/messages`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Mailpit messages:', error.message);
      return { messages: [], total: 0 };
    }
  }

  static async waitForMessage(recipient: string, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const data = await this.getMessages();
      const msg = data.messages.find((m: any) => 
        m.To.some((to: any) => to.Address === recipient)
      );
      if (msg) {
        // Fetch full message to get content
        const fullMsg = await axios.get(`${this.MAILPIT_API}/message/${msg.ID}`);
        return fullMsg.data;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Timeout waiting for email to ${recipient}`);
  }
}
