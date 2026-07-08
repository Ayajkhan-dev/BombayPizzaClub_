import React from 'react'

function CategoryCard({name,image,onClick}) {
  return (
    <div 
      className='w-[100px] h-[100px] md:w-[170px] md:h-[170px] rounded-2xl md:rounded-3xl border-2 border-[#ff4d2d]/20 shrink-0 overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 relative cursor-pointer group'
      onClick={onClick}
    >
      <img 
        src={image} 
        alt={name} 
        className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
      />
      <div className='absolute bottom-0 w-full left-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-2 md:px-3 py-1.5 md:py-2 text-center'>
        <span className='text-[10px] md:text-sm font-bold text-white drop-shadow-md'>
          {name}
        </span>
      </div>
    </div>
  )
}

export default CategoryCard