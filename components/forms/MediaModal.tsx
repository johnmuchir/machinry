import React, { useState } from 'react';
import Image from 'next/image';

interface MediaModalProps {
  images: string[];
  onClose: () => void;
}

const MediaModal: React.FC<MediaModalProps> = ({ images, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className='fixed top-0 left-0 w-full h-full bg-black flex justify-center items-center z-50 zoom-out-50' >
      <div className='h-auto w-full overflow-hidden bg-dark-4 relative md:max-w-screen-md '>
        <Image
          src={images[currentImageIndex]}
          alt=""
          width={1000}
          height={1000}
          className="w-full h-full"
        />
        {images.length > 1 && (
          <>
            <button className=" absolute bottom-1/3 left-0 p-2 rounded-lg text-white " onClick={handlePrevImage}>
              <Image
                src="/assets/left.png" 
                alt="next"
                width={24}
                height={24}
              />
            </button>
            <button className="absolute bottom-1/3 right-0 p-2 rounded-lg text-white " onClick={handleNextImage}>
              <Image
                src="/assets/right.png" 
                alt="next"
                width={24}
                height={24}
              />
            </button>
          </>
        )}
      </div>
      <button className='text-red-500 absolute bottom-10 qursor 'onClick={onClose}>
        <Image
          src='/assets/back.svg'
          alt='search'
          width={24}
          height={24}
          className='object-contain'
        />
        Back
      </button>
    </div>
  );
};

export default MediaModal;

