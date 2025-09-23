function initCarousel() {
    // 走马灯功能
    const carouselInner = document.querySelector(".carousel-inner");
    const carouselItems = document.querySelectorAll(".carousel-item");
    const carouselIndicators = document.querySelectorAll(
        ".carousel-indicator"
    );
    const prevBtn = document.querySelector(".carousel-prev");
    const nextBtn = document.querySelector(".carousel-next");
    let currentIndex = 0;
    const totalItems = carouselItems.length;

    // 更新走马灯状态
    function updateCarousel() {
        carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
        carouselIndicators.forEach((indicator, index) => {
            indicator.classList.toggle("active", index === currentIndex);
        });
    }

    // 下一张
    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalItems;
        updateCarousel();
    }

    // 上一张
    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        updateCarousel();
    }

    // 绑定事件
    nextBtn.addEventListener("click", nextSlide);
    prevBtn.addEventListener("click", prevSlide);

    // 指示器点击
    carouselIndicators.forEach((indicator, index) => {
        indicator.addEventListener("click", () => {
            currentIndex = index;
            updateCarousel();
        });
    });

    // 自动播放
    let carouselInterval = setInterval(nextSlide, 5000);

    // 鼠标悬停时暂停自动播放
    const carousel = document.querySelector(".carousel");
    carousel.addEventListener("mouseenter", () => {
        clearInterval(carouselInterval);
    });

    carousel.addEventListener("mouseleave", () => {
        carouselInterval = setInterval(nextSlide, 5000);
    });
}

function initTextarea() {

    const textarea = document.querySelector(".auto-resize-textarea");

    // 动态生成案例Tab
    const tabContainer = document.getElementById("tabContainer");
    const templates = {
        template1: {
            title: "案例一",
            content:
                "https://cm.jcaigc.cn/openapi/v1/get_draft?draft_id=2025090716400922f559b4",
        },
        template2: {
            title: "案例二",
            content:
                "https://cm.jcaigc.cn/openapi/v1/get_draft?draft_id=202509151914009cdf8766",
        },
        template3: {
            title: "案例三",
            content:
                "https://cm.jcaigc.cn/openapi/v1/get_draft?draft_id=2025091519145792de542a",
        },
    };

    // 动态生成Tab按钮
    Object.keys(templates).forEach((key, index) => {
        const template = templates[key];
        const button = document.createElement("button");
        button.className = "tab-btn";
        button.textContent = template.title;
        button.setAttribute("data-template", key);

        // 第一个按钮设置为active
        if (index === 0) {
            button.classList.add("active");
            // 设置第一个模板为默认内容
            textarea.value = template.content;
            textarea.dispatchEvent(new Event("input"));
        }

        tabContainer.appendChild(button);
    });

    // 案例模板功能
    const tabButtons = document.querySelectorAll(".tab-btn");

    tabButtons.forEach((button) => {
        button.addEventListener("click", function () {
            // 移除所有active类
            tabButtons.forEach((btn) => btn.classList.remove("active"));
            // 添加active类到当前按钮
            this.classList.add("active");

            // 获取对应的模板内容
            const templateId = this.getAttribute("data-template");
            const content = templates[templateId].content;

            // 更新文本区域内容
            textarea.value = content;
            textarea.dispatchEvent(new Event("input"));

            // 添加日志
            addLog(`已切换到模板：${this.textContent}`);
        });
    });
}