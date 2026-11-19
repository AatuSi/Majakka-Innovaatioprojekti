import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAvatar } from './avatarStore'

// Fills its round container, which sets the size and the icon's color.
export default function ProfileAvatar() {
  const avatar = useAvatar()

  if (avatar.kind === 'icon') return <FontAwesomeIcon icon={avatar.icon} />

  return <img src={avatar.url} alt="" className="h-full w-full object-cover" />
}
