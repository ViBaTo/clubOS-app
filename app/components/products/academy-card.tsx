import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface AcademyProgram {
  id: number
  name: string
  instructor: string
  instructorAvatar: string
  schedule: string
  duration: string
  price: number
  image: string
}

interface AcademyCardProps {
  program: AcademyProgram
  onView?: (program: AcademyProgram) => void
}

export function AcademyCard({ program, onView }: AcademyCardProps) {
  return (
    <div className='bg-white rounded-xl shadow-sm border-0 p-6 hover:shadow-md transition-shadow duration-200 group'>
      {/* Hero image */}
      <div className='relative mb-4 rounded-lg overflow-hidden'>
        <Image
          src={program.image || '/placeholder.svg'}
          alt={program.name}
          width={300}
          height={200}
          className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
        />
      </div>

      {/* Program info */}
      <div className='space-y-4'>
        <div>
          <h3 className='text-xl font-semibold text-[#0F172A] mb-2 text-balance'>
            {program.name}
          </h3>
          <p className='text-sm text-[#64748B] leading-relaxed'>
            {program.duration}
          </p>
        </div>

        {/* Instructor */}
        <div className='flex items-center gap-3'>
          <Image
            src={program.instructorAvatar || '/placeholder.svg'}
            alt={program.instructor}
            width={40}
            height={40}
            className='w-10 h-10 rounded-full object-cover'
          />
          <div>
            <p className='text-sm font-medium text-[#0F172A]'>
              {program.instructor}
            </p>
            <p className='text-xs text-[#94A3B8]'>Instructor</p>
          </div>
        </div>

        {/* Schedule */}
        <div className='flex items-center gap-2'>
          <span className='material-symbols-outlined text-[#94A3B8] text-lg'>
            schedule
          </span>
          <p className='text-sm text-[#64748B]'>{program.schedule}</p>
        </div>

        {/* Price */}
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-2xl font-bold text-[#0F172A]'>
              €{program.price}
            </p>
            <p className='text-xs text-[#94A3B8]'>por clase</p>
          </div>
        </div>

        {/* Separator */}
        <div className='h-px bg-[#94A3B8]/20'></div>

        {/* Action buttons */}
        <div className='flex gap-3'>
          <Button
            variant='outline'
            size='sm'
            className='flex-1 border-[#94A3B8]/30 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all duration-150 bg-transparent'
            onClick={() => onView?.(program)}
          >
            Ver detalles
          </Button>
          <Button
            size='sm'
            className='flex-1 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white transition-all duration-150'
          >
            Inscribirse
          </Button>
        </div>
      </div>
    </div>
  )
}
