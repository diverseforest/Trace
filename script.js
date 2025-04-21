document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-trip-form');
    const tripListContainer = document.getElementById('trip-list');
    const collapsibleHeader = document.querySelector('.collapsible');
    const tabsContainer = document.querySelector('.tabs');
    const contentSections = document.querySelectorAll('.content-section');

    // 添加标签切换功能
    if (tabsContainer) {
        const tabs = tabsContainer.querySelectorAll('span');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有标签的active类
                tabs.forEach(t => t.classList.remove('active'));
                // 给当前点击的标签添加active类
                this.classList.add('active');
                
                // 显示对应的内容区域
                const targetId = this.getAttribute('data-target');
                contentSections.forEach(section => {
                    section.style.display = section.id === targetId ? 'block' : 'none';
                });
            });
        });
        
        // 初始化显示第一个标签内容
        tabs[0].click();
    }

    // 添加折叠功能
    if (collapsibleHeader) {
        collapsibleHeader.addEventListener('click', function() {
            this.classList.toggle('collapsed');
        });
        // 初始化为折叠状态
        collapsibleHeader.classList.add('collapsed');
    }

    // Load trips from localStorage or initialize empty array
    let trips = JSON.parse(localStorage.getItem('trips')) || [];

    // Initial render
    renderTrips();

    // 表单提交处理
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const startTime = document.getElementById('start-time').value;
            const newTrip = {
                startTime: startTime,
                startAddress: document.getElementById('start-location-address').value,
                endPlaceName: document.getElementById('end-location-name').value,
                distance: parseFloat(document.getElementById('distance').value),
                duration: document.getElementById('duration').value,
                avgSpeed: parseInt(document.getElementById('avg-speed').value, 10),
                maxSpeed: parseInt(document.getElementById('max-speed').value, 10),
                id: Date.now()
            };

            trips.unshift(newTrip);
            localStorage.setItem('trips', JSON.stringify(trips));
            renderTrips();
            form.reset();

            // 提交后折叠表单
            if (collapsibleHeader) {
                collapsibleHeader.classList.add('collapsed');
            }
            
            // 提交后切换到出行轨迹标签
            const tripsTab = document.querySelector('.tabs span[data-target="trips-section"]');
            if (tripsTab) {
                tripsTab.click();
            }
        });
    }

    function renderTrips() {
        tripListContainer.innerHTML = '';

        if (trips.length === 0) {
            tripListContainer.innerHTML = '<p>还没有导航记录。</p>';
            return;
        }

        // Sort trips by startTime descending (just in case they weren't added chronologically)
        trips.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        const tripsByMonth = {};

        // Group trips by month (YYYY-MM)
        trips.forEach(trip => {
            // Handle potential invalid date strings
            const date = new Date(trip.startTime);
            if (isNaN(date.getTime())) {
                 console.warn("Invalid date encountered:", trip.startTime);
                 return; // Skip this trip if date is invalid
            }
            const monthKey = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
            if (!tripsByMonth[monthKey]) {
                tripsByMonth[monthKey] = {
                    records: [],
                    totalDistance: 0
                };
            }
            tripsByMonth[monthKey].records.push(trip);
            tripsByMonth[monthKey].totalDistance += trip.distance;
        });

        // Get sorted month keys (newest month first)
        const sortedMonths = Object.keys(tripsByMonth).sort((a, b) => {
             const [yearA, monthA] = a.match(/(\d+)年(\d+)月/).slice(1);
             const [yearB, monthB] = b.match(/(\d+)年(\d+)月/).slice(1);
             return (parseInt(yearB, 10) * 100 + parseInt(monthB, 10)) - (parseInt(yearA, 10) * 100 + parseInt(monthA, 10));
        });


        // Render each month group
        sortedMonths.forEach(monthKey => {
            const monthData = tripsByMonth[monthKey];

            // 创建月份组容器
            const monthGroup = document.createElement('div');
            monthGroup.classList.add('month-group');

            // 创建月份标题
            const monthHeaderDiv = document.createElement('div');
            monthHeaderDiv.classList.add('month-header');

            const monthTitle = document.createElement('div');
            monthTitle.classList.add('month-title');
            monthTitle.textContent = monthKey;

            const monthSummary = document.createElement('div');
            monthSummary.classList.add('month-stats');
            const formattedDistance = monthData.totalDistance.toFixed(1);
            monthSummary.textContent = `${monthData.records.length}次导航 ${formattedDistance}公里`;

            monthHeaderDiv.appendChild(monthTitle);
            monthHeaderDiv.appendChild(monthSummary);
            monthGroup.appendChild(monthHeaderDiv);

            // 渲染该月的行程
            monthData.records.forEach(trip => {
                // 格式化日期和时间
                const date = new Date(trip.startTime);
                const formattedTime = `${String(date.getFullYear())}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                // 创建行程卡片
                const tripCard = document.createElement('div');
                tripCard.classList.add('trip-card');
                
                // 在renderTrips函数中的渲染部分
                tripCard.innerHTML = `
                    <div class="trip-header">
                        <svg class="trip-icon" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
                            <g fill="#3774FE">
                                <path d="M83.5 151.9 c-25.8 -2.7 -47.3 -21.2 -54 -46.4 -2.1 -8 -2.1 -22.4 0 -30.5 5.8 -22.3 23 -39.7 45 -45.5 8 -2.1 22.4 -2.1 30.5 0 22.3 5.8 39.7 23 45.5 45 2.1 8 2.1 22.4 0 30.5 -7.9 30.4 -36.1 50.2 -67 46.9z"/>
                            </g>
                            <g fill="#ffffff">
                                <!-- 汽车图标的白色部分保持不变 -->
                                <path d="M59.3 115.4 c-0.9 -0.4 -1.3 -3.9 -1.3 -12.3 0 -11.4 0.1 -11.9 2.9 -15.8 1.6 -2.2 3.2 -5 3.6 -6.4 1.7 -5.5 6 -12.1 9.4 -14.2 3.2 -2 4.9 -2.2 15.6 -2.2 9.8 0 12.7 0.4 15.8 1.9 4.1 2 7.9 7.2 10.3 13.9 0.8 2.2 2.6 5.5 3.9 7.3 2.3 3.1 2.5 4 2.5 15.3 0 11.9 0 12.1 -2.4 12.7 -1.3 0.3 -3.7 0.4 -5.2 0.2 -2.5 -0.2 -2.9 -0.8 -3.2 -3.5 l-0.3 -3.3 -20.3 0 -20.2 0 -0.9 3.3 c-0.9 2.9 -1.4 3.2 -5 3.4 -2.2 0.1 -4.6 0 -5.2 -0.3z m19.1 -17.3 c0.3 -0.5 -0.4 -2 -1.5 -3.5 -1.8 -2.3 -2.8 -2.6 -8 -2.6 -5.8 0 -5.9 0 -5.9 2.8 0 1.6 0.3 3.2 0.7 3.5 1 1 14.1 0.8 14.7 -0.2z m38.6 -0.6 c0.6 -0.8 0.9 -2.3 0.5 -3.5 -0.5 -1.7 -1.5 -2 -6.2 -2 -6.1 0 -9.3 1.8 -9.3 5.2 0 1.6 0.9 1.8 6.9 1.8 4.8 0 7.2 -0.4 8.1 -1.5z m-7 -14 c0 -1.8 -4.4 -8.6 -6.6 -10.4 -2.3 -1.8 -4 -2.1 -13.5 -2.1 -9.9 0 -11 0.2 -13.6 2.4 -1.6 1.4 -3.7 4.3 -4.5 6.5 l-1.6 4.1 19.9 0 c10.9 0 19.9 -0.2 19.9 -0.5z"/>
                                <path d="M53.4 82.5 c-1 -2.6 0.4 -4.5 3.5 -4.5 2.8 0 4.1 1.4 4.1 4.6 0 2 -6.9 1.9 -7.6 -0.1z"/>
                                <path d="M119 82.2 c0 -2.4 1.9 -4.2 4.5 -4.2 3.1 0 4.6 1.9 3.4 4.2 -1.4 2.5 -7.9 2.6 -7.9 0z"/>
                            </g>
                        </svg>
                        <div class="trip-time">${formattedTime}</div>
                        <div class="trip-action">再次导航</div>
                    </div>
                    <div class="trip-locations">
                        <div class="location-line"></div>
                        <div class="location-point start"></div>
                        <div class="location-point end"></div>
                        <div class="location-address">${trip.startAddress || trip.endAddress || '未知起点'}</div>
                        <div class="location-name">${trip.endPlaceName || '未知终点'}</div>
                    </div>
                    <div class="trip-stats">
                        <div class="stat-item">
                            <div class="stat-value">${trip.distance < 1 ? '< 1' : trip.distance.toFixed(1)} <span class="unit" style="color:#75819C">km</span></div>
                            <div class="stat-label">导航里程</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${trip.duration}</div>
                            <div class="stat-label">驾驶时长</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${trip.avgSpeed} <span class="unit" style="color:#75819C">km/h</span></div>
                            <div class="stat-label">平均速度</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${trip.maxSpeed} <span class="unit" style="color:#75819C">km/h</span></div>
                            <div class="stat-label">最快速度</div>
                        </div>
                    </div>
                `;
                
                monthGroup.appendChild(tripCard);
            });

            tripListContainer.appendChild(monthGroup);
        });
    }
});

// 添加清空所有行程的功能
document.querySelector('.clear-all-btn').addEventListener('click', function() {
    if (confirm('确定要清空所有行程记录吗？此操作不可撤销。')) {
        localStorage.removeItem('trips');
        trips = [];
        renderTrips();
    }
});