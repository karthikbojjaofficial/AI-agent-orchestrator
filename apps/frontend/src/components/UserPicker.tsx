import { useEffect } from 'react'
import './UserPicker.css'

interface UserPickerProps {
  selectedUser: string
  onUserChange: (userId: string) => void
}

const USERS = [
  { id: 'user_1', label: 'User 1' },
  { id: 'user_2', label: 'User 2' },
  { id: 'user_3', label: 'User 3' }
]

function UserPicker({ selectedUser, onUserChange }: UserPickerProps) {
  // Load saved user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('selectedUserId')
    if (savedUser && USERS.find(u => u.id === savedUser)) {
      onUserChange(savedUser)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value
    onUserChange(userId)
    // Save to localStorage
    localStorage.setItem('selectedUserId', userId)
  }

  return (
    <div className="user-picker">
      <label htmlFor="user-select">Select User:</label>
      <select
        id="user-select"
        value={selectedUser}
        onChange={handleChange}
        className="user-select"
      >
        {USERS.map(user => (
          <option key={user.id} value={user.id}>
            {user.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default UserPicker
