import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAvatar } from './avatarStore'

// Fills its round container, which sets the size and the icon's color.
export default function ProfileAvatar() {
  const { selectedIcon, uploadedImage } = useAvatar()

  if (selectedIcon) return <FontAwesomeIcon icon={selectedIcon} />

  return uploadedImage ? (
    <img src={uploadedImage} alt="" className="h-full w-full object-cover" />
  ) : null
}