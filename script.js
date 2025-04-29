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
        //collapsibleHeader.classList.add('collapsed');
    }

    // Load trips from localStorage or initialize empty array
    let trips = JSON.parse(localStorage.getItem('trips')) || [];

    // Initial render
    renderTrips();

    // 获取表单元素
    const distanceInput = document.getElementById('distance');
    const avgSpeedInput = document.getElementById('avg-speed');
    const durationHoursInput = document.getElementById('duration-hours');
    const durationMinutesInput = document.getElementById('duration-minutes');
    const durationSecondsInput = document.getElementById('duration-seconds');
    const durationInput = document.getElementById('duration'); // 隐藏的字段，用于存储 HH:MM:SS 格式

    // 添加事件监听器，用于在输入变化时更新计算
    if (distanceInput && avgSpeedInput && durationInput && durationHoursInput && durationMinutesInput && durationSecondsInput) {
        // 当里程输入变化时，根据当前情况更新计算
        distanceInput.addEventListener('input', function() {
            // 获取当前输入值
            const distance = parseFloat(this.value);
            const avgSpeed = parseFloat(avgSpeedInput.value);
            const hasTimeInput = durationHoursInput.value || durationMinutesInput.value || durationSecondsInput.value;
            
            // 如果里程有效且有平均速度，则计算时长
            if (distance > 0 && avgSpeed > 0) {
                calculateDuration(distance, avgSpeed);
            }
            // 如果里程有效且有时长，则计算平均速度
            else if (distance > 0 && hasTimeInput) {
                updateDurationField();
                calculateSpeed(distance);
            }
        });

        // 当平均速度输入变化时，计算驾驶时长
        // 使用 'input' 事件实现实时计算
        avgSpeedInput.addEventListener('input', function() {
            const distance = parseFloat(distanceInput.value);
            const avgSpeed = parseFloat(this.value);
            
            // 只有当里程和速度都有效时才计算时长
            if (distance > 0 && avgSpeed > 0) {
                calculateDuration(distance, avgSpeed);
            }
        });

        // 当驾驶时长的时、分、秒任一输入框变化时，计算平均速度
        [durationHoursInput, durationMinutesInput, durationSecondsInput].forEach(input => {
            input.addEventListener('input', function() {
                // 先根据时分秒更新隐藏的 HH:MM:SS 字段
                updateDurationField();
                
                // 获取里程
                const distance = parseFloat(distanceInput.value);
                
                // 如果里程有效，则计算平均速度
                if (distance > 0) {
                    calculateSpeed(distance);
                }
            });
        });
    }

    // 更新驾驶时长隐藏字段 (HH:MM:SS 格式)
    function updateDurationField() {
        // 获取时、分、秒的值，如果输入框为空，则视为 '0'
        // padStart(2, '0') 确保始终是两位数，例如 '5' -> '05'
        const hours = (durationHoursInput.value || '0').padStart(2, '0');
        const minutes = (durationMinutesInput.value || '0').padStart(2, '0');
        const seconds = (durationSecondsInput.value || '0').padStart(2, '0');

        // 将格式化后的时分秒组合成 HH:MM:SS 格式，并更新到隐藏的 input#duration 中
        durationInput.value = `${hours}:${minutes}:${seconds}`;
    }

    // 根据里程和平均速度计算驾驶时长
    function calculateDuration(distance, avgSpeed) {
        // 计算总秒数 = (距离 / 速度) * 3600，并四舍五入
        const totalSeconds = Math.round((distance / avgSpeed) * 3600);

        // 将计算出的总秒数转换回时、分、秒
        const hours = Math.floor(totalSeconds / 3600); // 计算小时部分
        const minutes = Math.floor((totalSeconds % 3600) / 60); // 计算分钟部分
        const seconds = totalSeconds % 60; // 计算秒钟部分

        // 更新页面上显示的时、分、秒输入框
        durationHoursInput.value = hours;
        durationMinutesInput.value = minutes;
        durationSecondsInput.value = seconds;

        // 计算完成后，也要同步更新隐藏的 duration 字段
        updateDurationField();
    }

    // 根据里程和时长计算平均速度
    function calculateSpeed(distance) {
        // 从隐藏字段 'HH:MM:SS' 中解析出时、分、秒的数值
        const durationParts = durationInput.value.split(':');
        const hours = parseInt(durationParts[0] || '0', 10); // 解析小时，如果为空则为0
        const minutes = parseInt(durationParts[1] || '0', 10); // 解析分钟，如果为空则为0
        const seconds = parseInt(durationParts[2] || '0', 10); // 解析秒钟，如果为空则为0
        
        // 计算总秒数
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        // 只有当总时长大于0秒时，计算才有意义
        if (totalSeconds > 0) {
            // 将总秒数转换为小时数，用于计算速度 (km/h)
            const timeInHours = totalSeconds / 3600;
            // 计算平均速度 = 距离(km) / 时间(小时)，并四舍五入到整数
            const calculatedSpeed = Math.round(distance / timeInHours);
            // 更新平均速度输入框的值
            avgSpeedInput.value = calculatedSpeed;
        }
    }

    // 表单提交处理
    if (form) {
        form.addEventListener('submit', (event) => {
            // 阻止表单默认的提交行为 (页面刷新)
            event.preventDefault();

            // 在提交前，最后进行一次计算和验证
            // 检查必填项: 获取最新的值
            const distance = parseFloat(distanceInput.value);
            // 检查隐藏字段的值是否有效 (不为空且不为 "00:00:00")
            const hasDuration = durationInput.value && durationInput.value !== '00:00:00';
            // 获取最新的平均速度值
            const avgSpeed = parseFloat(avgSpeedInput.value);

            // **验证逻辑**:
            // 1. 导航里程必须输入且大于0
            if (!distance || distance <= 0) {
                alert('请输入有效的导航里程 (必须大于0)');
                return; // 阻止提交
            }

            // 2. 平均速度和驾驶时长至少要有一个有效输入
            //   - 平均速度有效: avgSpeed 是数字且大于0
            //   - 驾驶时长有效: hasDuration 为 true
            if (!(avgSpeed && avgSpeed > 0) && !hasDuration) {
                alert('请至少输入有效的平均速度或驾驶时长');
                return; // 阻止提交
            }

            // **确保数据一致性**: 在验证通过后，再次运行计算逻辑，
            // 确保即使用户没有手动触发 change 事件 (例如直接点击提交)，
            // 也能根据当前输入计算出缺失的值。
            updateCalculations();

            // 获取其他表单字段的值
            const startTime = document.getElementById('start-time').value;
            const startAddress = document.getElementById('start-location-address').value;
            const endPlaceName = document.getElementById('end-location-name').value;
            const maxSpeed = parseInt(document.getElementById('max-speed').value, 10); // 获取最快速度

            // 创建新的行程对象
            const newTrip = {
                startTime: startTime,
                startAddress: startAddress,
                endPlaceName: endPlaceName,
                distance: parseFloat(distanceInput.value), // 确保使用最新的值
                duration: durationInput.value, // 使用隐藏字段的 HH:MM:SS 值
                avgSpeed: parseInt(avgSpeedInput.value, 10), // 确保使用最新的计算结果
                maxSpeed: maxSpeed || 0, // 如果没填最快速度，给个默认值0
                id: Date.now() // 使用时间戳作为唯一ID
            };

            // 将新行程添加到行程列表的开头
            trips.unshift(newTrip);
            // 将更新后的行程列表保存到 localStorage
            localStorage.setItem('trips', JSON.stringify(trips));
            // 重新渲染行程列表以显示新添加的记录
            renderTrips();
            // 清空表单，方便下次输入
            form.reset();
            // 清空隐藏的 duration 字段的值
            durationInput.value = '';

            // 提交成功后，如果折叠面板存在，则将其折叠起来
            if (collapsibleHeader) {
                collapsibleHeader.classList.add('collapsed');
            }

            // 提交成功后，自动切换回“出行轨迹”标签页
            const tripsTab = document.querySelector('.tabs span[data-target="trips-section"]');
            if (tripsTab) {
                tripsTab.click(); // 模拟点击“出行轨迹”标签
            }
        });
    }

    // 渲染行程列表的函数
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