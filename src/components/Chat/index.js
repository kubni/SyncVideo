import "./chat.css"

export default function Chat() {
  return (
    <div className="chat">
      <div className="online-users">
        <p>Online Users: PLACEHOLDER_COUNT</p>
        <ul>
          <li>User A</li>
          <li>User B</li>
          <li>User C</li>
        </ul>
      </div>
      <div className="message-history">
        <p>[13:00h] User A: Hello world!</p>
        <hr />
        <p>[13:05h] User B: Goodbye cruel world!</p>
      </div>
    </div>
  )
}
