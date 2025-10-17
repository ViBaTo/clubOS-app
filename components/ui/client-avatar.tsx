import Image from "next/image"

interface ClientAvatarProps {
  firstName?: string
  lastName?: string
  imageUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ClientAvatar({ firstName, lastName, imageUrl, size = "md", className = "" }: ClientAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  }

  const getInitial = () => {
    if (firstName && firstName.length > 0) {
      return firstName.charAt(0).toUpperCase()
    }
    if (lastName && lastName.length > 0) {
      return lastName.charAt(0).toUpperCase()
    }
    return "?"
  }

  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <Image
          src={imageUrl}
          alt={`${firstName || ''} ${lastName || ''}`}
          width={size === "sm" ? 32 : size === "md" ? 40 : 48}
          height={size === "sm" ? 32 : size === "md" ? 40 : 48}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-semibold ${className}`}>
      {getInitial()}
    </div>
  )
}

