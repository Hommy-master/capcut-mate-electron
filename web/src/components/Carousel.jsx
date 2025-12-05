import React, { useState, useEffect } from 'react';

function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = [
    {
      id: 'one',
      title: '美丽山脉',
      description: '自然风光的壮丽与宁静'
    },
    {
      id: 'two',
      title: '宁静海滩',
      description: '夏日海滩的悠闲时光'
    },
    {
      id: 'three',
      title: '神秘森林',
      description: '探索未知的自然奥秘'
    }
  ];

  const totalItems = items.length;

  const updateCarousel = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalItems);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalItems) % totalItems);
  };

  useEffect(() => {
    // 自动播放
    const carouselInterval = setInterval(nextSlide, 5000);

    return () => clearInterval(carouselInterval);
  }, []);

  return (
    <section className="module">
      <div className="carousel">
        <div 
          className="carousel-inner" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item) => (
            <div key={item.id} className={`carousel-item ${item.id}`}>
              <div className="carousel-caption">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="carousel-control carousel-prev" onClick={prevSlide}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <button className="carousel-control carousel-next" onClick={nextSlide}>
          <i className="fas fa-chevron-right"></i>
        </button>
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <div 
              key={index} 
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => updateCarousel(index)}
            ></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Carousel;
