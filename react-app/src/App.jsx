import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import ColorBends from './ColorBends';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    details: ''
  });

  const lenisRef = useRef(null);

  // Список разделов для точек навигации
  const sections = [
    { id: 'hero', title: 'Главная' },
    { id: 'about', title: 'Кто мы' },
    { id: 'director', title: 'Руководство' },
    { id: 'investors', title: 'Инвесторы' },
    { id: 'today', title: 'Экспертиза' },
    { id: 'code', title: 'Кодекс А1' },
    { id: 'audience', title: 'Кто зарабатывает' },
    { id: 'contact', title: 'Контакты' }
  ];

  useEffect(() => {
    // Инициализация Lenis
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      smoothTouch: false,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Смена класса шапки при скролле
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      ScrollTrigger.create({
        start: 'top -50',
        onEnter: () => navbar.classList.add('navbar-scrolled'),
        onLeaveBack: () => navbar.classList.remove('navbar-scrolled'),
      });
    }

    // Синхронизация точек dot-navigation с прокруткой
    sections.forEach((sec, idx) => {
      ScrollTrigger.create({
        trigger: `#${sec.id}`,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => setActiveSection(sec.id),
        onEnterBack: () => setActiveSection(sec.id)
      });
    });

    // Анимация Hero секции
    const heroTl = gsap.timeline();
    heroTl.from('.hero-title', {
      y: 40,
      opacity: 0,
      filter: 'blur(10px)',
      duration: 1.2,
      ease: 'power4.out',
    })
    .from('.hero-btns', {
      y: 20,
      opacity: 0,
      duration: 1.0,
      ease: 'power3.out'
    }, '-=0.8');

    // Плавное появление секций
    sections.forEach(sec => {
      if (sec.id === 'hero') return;

      const triggerEl = document.getElementById(sec.id);
      if (!triggerEl) return;

      const title = triggerEl.querySelector('.section-title');
      const desc = triggerEl.querySelector('.section-desc');
      const elements = triggerEl.querySelectorAll('.glass-panel, .solutions-grid > div, .code-scroll-item, .art-frame');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      if (title) {
        tl.from(title, {
          y: 30,
          opacity: 0,
          filter: 'blur(5px)',
          duration: 0.8,
          ease: 'power3.out'
        });
      }

      if (desc) {
        tl.from(desc, {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out'
        }, '-=0.6');
      }

      if (elements.length > 0) {
        tl.from(elements, {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out'
        }, '-=0.5');
      }
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handleScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target && lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: -80, duration: 1.2 });
      setIsMenuOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    // Имитация отправки формы
    setTimeout(() => {
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        details: ''
      });
    }, 2000);
  };

  return (
    <>
      {/* 3D ColorBends Background */}
      <div className="canvas-bg-container">
        <ColorBends
          rotation={95}
          speed={0.1}
          colors={["#f60202", "#3601f2", "#f1ebeb"]}
          transparent
          autoRotate={0}
          scale={0.9}
          frequency={1}
          warpStrength={1}
          mouseInfluence={0.5}
          parallax={0.6}
          noise={0.1}
          iterations={1}
          intensity={1}
          bandWidth={6}
        />
      </div>

      {/* Side Dot Navigation */}
      <nav className="dot-nav">
        <ul>
          {sections.map(sec => (
            <li key={sec.id}>
              <a
                href={`#${sec.id}`}
                className={activeSection === sec.id ? 'active' : ''}
                title={sec.title}
                onClick={(e) => handleScroll(e, `#${sec.id}`)}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="container nav-container">
          <a href="#hero" className="logo" onClick={(e) => handleScroll(e, '#hero')}>
            <img src="/images/logo.webp" alt="А1" className="logo-img" />
          </a>
          <ul className={`nav-links ${isMenuOpen ? 'nav-active' : ''}`}>
            {sections.map(sec => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className="nav-btn"
                  onClick={(e) => handleScroll(e, `#${sec.id}`)}
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>
          <div
            className={`burger ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span style={{ transform: isMenuOpen ? 'translateY(8px) rotate(45deg)' : 'none' }}></span>
            <span style={{ opacity: isMenuOpen ? '0' : '1' }}></span>
            <span style={{ transform: isMenuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none' }}></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero bg-glow-container">
        <div className="glow-orb glow-orb-blue" style={{ top: '10%', right: '10%' }}></div>
        <div className="container hero-layout">
          <div className="hero-content">
            <h1 className="hero-title text-gradient-chrome">
              А1 — ВЕДУЩИЙ ЭКСПЕРТ ПО ИНВЕСТИЦИЯМ В СПЕЦИАЛЬНЫЕ СИТУАЦИИ
            </h1>
            <div className="hero-btns" style={{ marginTop: '32px' }}>
              <a
                href="#about"
                className="btn-premium btn-premium-primary"
                onClick={(e) => handleScroll(e, '#about')}
              >
                Подробнее о нас
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <span className="section-label">01 / Кто мы</span>
          <div className="about-layout">
            <div className="about-info">
              <h2 className="section-title text-gradient-chrome">УНИКАЛЬНЫЙ ОПЫТ</h2>
              <div className="about-text">
                <p>
                  А1 — ведущая инвестиционная компания России, эксперт по разрешению сложных корпоративных споров и реструктуризации активов.
                </p>
                <p>
                  Мы находим решения в ситуациях, которые кажутся безвыходными, защищая капитал и восстанавливая жизнеспособность бизнеса.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="art-frame">
                <img src="/images/Racing/chrome_building.png" alt="Офис А1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Director Section */}
      <section id="director" className="about bg-glow-container">
        <div className="glow-orb glow-orb-red" style={{ top: '20%', left: '5%' }}></div>
        <div className="container">
          <span className="section-label">02 / Руководство</span>
          <div className="about-layout">
            <div className="about-info">
              <h2 className="section-title text-gradient-chrome">АЛЕКСАНДР ФАЙН</h2>
              <p style={{
                color: 'var(--color-accent-red)',
                fontWeight: 'bold',
                marginBottom: '24px',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase'
              }}>
                Генеральный директор А1
              </p>
              <div className="about-text" style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>
                <p>Родился в 1936 году в Москве, детство провел на Колыме. В 1958 году с отличием окончил машиностроительный факультет Московского института химического машиностроения (МИХМ).</p>
                <p>До 1988 года работал главным конструктором по ряам образцов новой техники. В 1990–1992 годах был председателем научно-технического кооператива «Альфа-фото». С 1992 года — генеральный директор АО «Альфа-Эко», после 2004 года — А1. С 2022 года — владелец 100% долей А1 и генеральный директор.</p>
                <p>Александр Файн также широко известен как прозаик и драматург. Является членом Международного сообщества писательских союзов, лауреатом Премии имени А. П. Чехова за 2009 год, номинантом престижной российской литературной премии «Большая книга» за 2012 год.</p>
              </div>
              <div style={{ marginTop: '40px' }}>
                <a
                  href="https://pro.rbc.ru/demo/699463959a79476ba6422508"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium btn-premium-primary"
                >
                  Интервью Александра Файна РБК в 2026 году
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="art-frame">
                <img src="/images/IMG_6513v2.WEBP" alt="Александр Файн" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investors Section */}
      <section id="investors" className="about">
        <div className="container">
          <span className="section-label">03 / Инвесторы</span>
          <div className="about-layout">
            <div className="about-info">
              <h2 className="section-title text-gradient-chrome">ИНВЕСТОРЫ СПЕЦИАЛЬНОГО НАЗНАЧЕНИЯ</h2>
              <div className="about-text">
                <p>
                  В команде А1 более 70 профессионалов с особым опытом в сложных инвестиционных ситуациях.
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
                <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>01</div>
                  <div>
                    <p style={{ fontWeight: 6, color: '#fff', marginBottom: '4px' }}>Глубокий опыт</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Опыт, приобретённый при заключении самых крупных и сложных сделок в стране.</p>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>02</div>
                  <div>
                    <p style={{ fontWeight: 6, color: '#fff', marginBottom: '4px' }}>Всестороннее понимание</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Понимание логики всех сторон — акционеров, менеджмента, кредиторов, регуляторов.</p>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>03</div>
                  <div>
                    <p style={{ fontWeight: 6, color: '#fff', marginBottom: '4px' }}>Мультидисциплинарность</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Способность одновременно работать с нормами права, финансами, управлением, GR и PR.</p>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>04</div>
                  <div>
                    <p style={{ fontWeight: 6, color: '#fff', marginBottom: '4px' }}>Предельная дисциплина</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Предельная дисциплина и способность доводить ситуацию до результата.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="art-frame">
                <img src="/images/Racing/Image_se7cf3se7cf3se7c.png" alt="Инвесторы А1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section id="today" className="solutions bg-glow-container">
        <div className="glow-orb glow-orb-blue" style={{ bottom: '5%', right: '5%' }}></div>
        <div className="container">
          <span className="section-label">04 / Экспертиза</span>
          <h2 className="section-title text-gradient-chrome">УНИВЕРСАЛЬНАЯ ЭКСПЕРТИЗА</h2>
          
          <div className="about-layout" style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <details className="glass-panel" style={{ padding: '24px', cursor: 'pointer', outline: 'none', borderRadius: '20px' }} open>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  <span>Разрешение корпоративных конфликтов</span>
                  <span className="accordion-arrow" style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem' }}>+</span>
                </summary>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6', cursor: 'default' }}>
                  Восстанавливаем управляемость бизнеса, разрешаем споры между акционерами и топ-менеджментом.
                </p>
              </details>
              
              <details className="glass-panel" style={{ padding: '24px', cursor: 'pointer', outline: 'none', borderRadius: '20px' }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  <span>Реструктуризация и управление долгами</span>
                  <span className="accordion-arrow" style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem' }}>+</span>
                </summary>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6', cursor: 'default' }}>
                  Разрабатываем комплексные программы финансового оздоровления, ведем переговоры с банками.
                </p>
              </details>
              
              <details className="glass-panel" style={{ padding: '24px', cursor: 'pointer', outline: 'none', borderRadius: '20px' }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  <span>Инвестиционное консультирование</span>
                  <span className="accordion-arrow" style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem' }}>+</span>
                </summary>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6', cursor: 'default' }}>
                  Помогаем структурировать сложные M&A сделки, оцениваем риски и юридическую чистоту.
                </p>
              </details>

              <details className="glass-panel" style={{ padding: '24px', cursor: 'pointer', outline: 'none', borderRadius: '20px' }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  <span>Вхождение в капитал и M&A</span>
                  <span className="accordion-arrow" style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem' }}>+</span>
                </summary>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6', cursor: 'default' }}>
                  Приобретаем доли в проблемных или недооцененных активах, развиваем их стоимость.
                </p>
              </details>

              <details className="glass-panel" style={{ padding: '24px', cursor: 'pointer', outline: 'none', borderRadius: '20px' }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  <span>Медиация и переговоры</span>
                  <span className="accordion-arrow" style={{ color: 'var(--color-accent-blue)', fontSize: '1.5rem' }}>+</span>
                </summary>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6', cursor: 'default' }}>
                  Помогаем уладить разногласия любой сложности, чтобы все стороны заработали.
                </p>
              </details>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="art-frame">
                <img src="/images/Racing/Generated_Image_grubk0grubk0grub.png" alt="Экспертиза А1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Section */}
      <section id="code" className="about">
        <div className="container">
          <span className="section-label">05 / Кодекс А1</span>
          <h2 className="section-title text-gradient-chrome" style={{ marginBottom: '40px' }}>
            10 принципов, которых придерживается наша команда
          </h2>
          
          <div className="about-layout" style={{ alignItems: 'stretch', gap: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'start' }}>
              <div className="art-frame">
                <img src="/images/Racing/Generated_Image_5ddf5x5ddf5x5ddf.png" alt="Кодекс А1" />
              </div>
            </div>
            
            <div className="code-scroll-container">
              {[
                { num: '01', title: 'Закон и прозрачность', desc: 'Любое решение — в правовом поле и с подтверждениями.' },
                { num: '02', title: 'Уважение к правам сторон', desc: 'Не применяем и не поддерживаем практики захвата и давления.' },
                { num: '03', title: 'Конфиденциальность', desc: 'Защищаем информацию сторон; публичность — по правилам.' },
                { num: '04', title: 'Интерес сделки превыше шумихи', desc: 'Избегаем медийных игр; повышаем вероятность закрытия.' },
                { num: '05', title: 'Сознательно идём на риск', desc: 'Участвуем в сложных сделках, где другие пасуют.' },
                { num: '06', title: 'Ответственная скорость', desc: 'Двигаемся быстро, опираясь на факты и проверки.' },
                { num: '07', title: 'Инвестируем собственные средства', desc: 'Входим капиталом и приобретаем активы.' },
                { num: '08', title: 'Переговоры прежде всего', desc: 'Приоритет — медиация и суды, а не эскалация.' },
                { num: '09', title: 'Совпадение интересов', desc: 'Конструируем сделки выгодно для всех участников.' },
                { num: '10', title: 'Публичная ответственность', desc: 'Готовы объяснить наши принципы любому стейкхолдеру и выйти из процессов, что им противоречат.' }
              ].map(item => (
                <div className="code-scroll-item" key={item.num}>
                  <div className="code-scroll-num">{item.num}</div>
                  <div className="code-scroll-content">
                    <h4 className="code-scroll-title">{item.title}</h4>
                    <p className="code-scroll-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section id="audience" className="solutions">
        <div className="container">
          <span className="section-label">06 / Кто зарабатывает с А1</span>
          <h2 className="section-title text-gradient-chrome" style={{ marginBottom: '48px' }}>
            КТО ЗАРАБАТЫВАЕТ С А1
          </h2>
          
          <div className="solutions-grid">
            {[
              { title: 'Основатели', sit: 'усталость от бизнеса, выход из него, споры с партнерами.', role: 'корректный выход с сохранением стоимости.' },
              { title: 'Акционеры', sit: 'разногласия в структуре, тупик в решениях и выходе.', role: 'выстроить договоренность или реализовать долю.' },
              { title: 'Партнёры', sit: 'есть проект, но нет опыта в спецситуациях или GR/PR.', role: 'структурировать сделку и довести до результата.' },
              { title: 'Менеджмент с долей', sit: 'участие в капитале без влияния, споры с собственниками.', role: 'помочь договориться о новой конфигурации или выходе.' },
              { title: 'Банки и кредиторы', sit: 'заемщик не платит, стандартные меры не работают.', role: 'включиться в ситуацию, найти решение и обеспечить возврат.' },
              { title: 'Наследники', sit: 'сложное владение, противоречия в семье, нет контроля.', role: 'собрать инструменты для сохранения капитала.' }
            ].map((card, idx) => (
              <div className="solution-card glass-panel" key={idx}>
                <h3 className="solution-title">{card.title}</h3>
                <p className="solution-desc" style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#fff' }}>Ситуации:</strong> {card.sit}
                </p>
                <p className="solution-desc">
                  <strong style={{ color: 'var(--color-accent-blue)' }}>Роль А1:</strong> {card.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Contacts */}
      <footer id="contact" className="site-footer">
        <div className="container">
          {/* Media Trust Logos */}
          <div className="trust-section" style={{ marginBottom: '80px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '60px' }}>
            <h3 className="text-center text-gradient-chrome" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '40px', textAlign: 'center' }}>
              Нам доверяют:
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '40px 80px' }}>
              {[
                { name: 'Ведомости', src: '/images/Логотипы СМИ для сайта/Логотипы СМИ для сайта/Ведомости.png', height: '32px' },
                { name: 'Коммерсант', src: '/images/Логотипы СМИ для сайта/Логотипы СМИ для сайта/Коммерсант.png', height: '32px' },
                { name: 'Forbes', src: '/images/Логотипы СМИ для сайта/Логотипы СМИ для сайта/Forbes_no_bg.png', height: '36px' },
                { name: 'РБК', src: '/images/Логотипы СМИ для сайта/Логотипы СМИ для сайта/РБК.png', height: '32px' }
              ].map((logo, idx) => (
                <img
                  key={idx}
                  src={logo.src}
                  alt={logo.name}
                  style={{
                    maxHeight: logo.height,
                    filter: 'brightness(0) invert(1) opacity(0.4)',
                    transition: 'opacity 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 0.4}
                />
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="contact-wrap">
            <h2 className="section-title text-center text-gradient-chrome" style={{ marginBottom: '48px', textAlign: 'center' }}>
              Отправить запрос
            </h2>
            <form id="contactForm" className="contact-form" onSubmit={handleSubmit}>
              {formSubmitted ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                  <h3 style={{ color: 'var(--color-accent-blue)', marginBottom: '16px' }}>Спасибо!</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Ваш запрос принят. Мы свяжемся с вами в ближайшее время.</p>
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <input
                        type="text"
                        name="full_name"
                        placeholder="ФИО*"
                        required
                        value={formData.full_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Телефон*"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email*"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      name="details"
                      placeholder="Подробности запроса (опишите вашу ситуацию)*"
                      required
                      rows="4"
                      value={formData.details}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-consent">
                    <label className="consent-label">
                      <input type="checkbox" required />
                      <span>
                        Я даю согласие на обработку моих персональных данных и соглашаюсь с{' '}
                        <a href="javascript:void(0)" onClick={() => setIsModalOpen(true)}>
                          Политикой обработки персональных данных
                        </a>.
                      </span>
                    </label>
                    <button type="submit" className="btn-premium btn-premium-primary" style={{ padding: '18px 48px' }}>
                      Отправить запрос
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Bottom split */}
          <div className="footer-bottom-info">
            <div className="footer-contact-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <a href="mailto:a-1@a-1.com">a-1@a-1.com</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="footer-contact-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href="tel:+74959670000">+7 495 967-00-00</a>
              </div>
              <div className="footer-contact-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ minWidth: '24px', marginTop: '2px' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>Краснопресненская наб., 12, Центр Международной Торговли, 7-й подъезд</span>
              </div>
            </div>
          </div>

          <div className="footer-copyright">
            <div className="footer-logo">
              <img src="/images/logo.webp" alt="А1" />
            </div>
            <p>&copy; 2026 A1. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <div className={`modal ${isModalOpen ? 'active' : ''}`} onClick={() => setIsModalOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</span>
          <div className="modal-body">
            <h2>Политика в отношении обработки персональных данных</h2>
            <p>Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006. №152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных, предпринимаемые Администрацией сайта A1 (далее — Оператор).</p>
            <h3>1. Общие положения</h3>
            <p>Оператор ставит своей важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных, в том числе защиты прав на неприкосновенность частной жизни, личную и семейную тайну.</p>
            <h3>2. Персональные данные</h3>
            <p>Оператор может обрабатывать: ФИО, номер телефона и адрес электронной почты Пользователя. Данные обрабатываются исключительно для связи с Пользователем и предоставления информации о услугах.</p>
            <h3>3. Согласие</h3>
            <p>Заполняя формы на сайте, Пользователь выражает свое согласие с данной Политикой. Оператор обеспечивает сохранность данных и принимает меры для защиты от несанкционированного доступа.</p>
            <p>Пользователь может отозвать согласие, направив уведомление Оператору по электронной почте.</p>
          </div>
        </div>
      </div>
    </>
  );
}
