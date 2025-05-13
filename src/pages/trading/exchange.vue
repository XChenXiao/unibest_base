<route lang="json5">
    {
      style: {
        navigationBarTitleText: '交易所',
      },
    }
    </route>
    <template>
        <view class="trading-container">
          <!-- 顶部波浪装饰 -->
          <view class="wave-decoration"></view>
          
          <!-- 顶部图片 -->
          <view class="header-banner">
          </view>
          
          <!-- 交易记录按钮 -->
          <view class="transaction-record-btn" @click="navigateTo('/pages/trading/records')">
            <text class="uni-icons uniui-list"></text>
            <text class="btn-text">交易记录</text>
          </view>
          
          <!-- 交易所标签 -->
          <!-- <view class="section-title">
            <text>交易所</text>
          </view> -->
          
          <!-- 资产类型 Tab 切换 -->
          <view class="asset-tabs">
            <view 
              class="tab-item" 
              :class="{ 'tab-active': activeTab === 'currency' }"
              @click="switchTab('currency')"
            >
              <text>黄金</text>
            </view>
            <view 
              class="tab-item" 
              :class="{ 'tab-active': activeTab === 'equity' }"
              @click="switchTab('equity')"
            >
              <text>股权</text>
            </view>
          </view>
          
          <!-- 货币内容 -->
          <view class="tab-content" v-if="activeTab === 'currency'">
            <!-- 货币交易子标签 -->
            <view class="currency-tabs">
              <view 
                class="currency-tab-item" 
                :class="{ 'currency-tab-active': activeCurrencyTab === 'buy' }"
                @click="switchCurrencyTab('buy')"
              >
                <text>买入</text>
              </view>
              <view 
                class="currency-tab-item" 
                :class="{ 'currency-tab-active': activeCurrencyTab === 'sell' }"
                @click="switchCurrencyTab('sell')"
              >
                <text>卖出</text>
              </view>
              
              <!-- 添加刷新按钮 -->
              <view class="refresh-btn" @click="fetchCurrencyOrders" :class="{ 'refreshing': loading }">
                <image src="/static/images/fresh.png" mode="widthFix" style="width: 30rpx; height: 30rpx;"/>
              </view>
            </view>
            
            <!-- 货币列表 -->
            <view class="currency-list">
              <view 
                v-for="(item, index) in filteredCurrencies" 
                :key="index"
                class="currency-item"
              >
                <!-- 货币图标和信息 -->
                <view class="currency-info-container">
                  <!-- 如果有图标URL则显示图片，否则显示字母图标 -->
                  <view class="currency-icon" v-if="item.iconUrl">
                    <image class="currency-image" :src="item.iconUrl" mode="aspectFit" />
                  </view>
                  <view class="currency-icon" v-else :style="{ backgroundColor: item.bgColor }">
                    <text class="currency-icon-text">{{ item.symbol.charAt(0) }}</text>
                  </view>
                  
                  <view class="currency-info">
                    <text class="currency-name">{{ item.name }} <text class="currency-symbol">({{ item.symbol }})</text></text>
                    <text class="currency-price">{{ activeCurrencyTab === 'buy' ? '买入价: ' : '卖出价: ' }}¥{{ formatAmount(activeCurrencyTab === 'buy' ? item.buyPrice : item.sellPrice) }}</text>
                    <view class="holding-info">
                      <text class="holding-amount">持有: {{ formatAmount(item.holdAmount) }}</text>
                      <text class="fee-info" v-if="activeCurrencyTab === 'sell'">手续费: {{ item.fee }}%</text>
                    </view>
                    <view class="limit-info">
                      <text class="limit-text">交易额: {{ formatAmount(item.minAmount) }}~{{ formatAmount(item.maxAmount) }}</text>
                      <text class="remaining-text" v-if="item.symbol !== 'USDT'">剩余: {{ formatAmount(item.remainingAmount) }}</text>
                    </view>
                  </view>
                </view>
                
                <!-- 交易按钮 -->
                <button 
                  class="trade-btn" 
                  :class="{ 
                    'sell-btn': activeCurrencyTab === 'sell',
                    'disabled-btn': activeCurrencyTab === 'sell' && item.holdAmount <= 0
                  }"
                  :disabled="activeCurrencyTab === 'sell' && item.holdAmount <= 0"
                  @click="handleTrade(item)"
                >
                  {{ activeCurrencyTab == 'buy' ? '买入' : '卖出' }}
                </button>
              </view>
              
              <!-- 空状态 -->
              <view v-if="filteredCurrencies.length === 0" class="empty-state">
                <text class="empty-text">{{ activeCurrencyTab === 'buy' ? '暂无可买入的货币' : '您暂无可卖出的货币' }}</text>
              </view>
            </view>
          </view>
          
          <!-- 股权内容 -->
          <view class="tab-content" v-if="activeTab === 'equity'">
            <view class="equity-card">
              <view class="equity-info-container">
                <view class="equity-info-item">
                  <text class="equity-label">股权价格</text>
                  <view class="equity-value-container">
                    <text class="equity-value">{{ formatAmount(equityPrice) }}</text>
                    <text class="equity-unit">元/股</text>
                  </view>
                </view>
                <view class="equity-divider"></view>
                <view class="equity-info-item">
                  <text class="equity-label">我的股权</text>
                  <view class="equity-value-container">
                    <text class="equity-value">{{ formatAmount(myEquity) }}</text>
                    <text class="equity-unit">股</text>
                  </view>
                </view>
              </view>
              <button class="sell-equity-btn" @click="handleSellEquity">出售股权</button>
            </view>
            
            <!-- 股权趋势图 -->

          </view>
          
          <!-- 出售股权弹窗 -->
          <sell-equity-popup 
            ref="sellEquityPopup"
            :equity-info="{ holdAmount: myEquity, price: equityPrice }"
            @close="closeSellEquityPopup"
            @confirm="confirmSellEquity"
          />
          
          <!-- 购买USDT弹窗 -->
          <buy-usdt-dialog 
            ref="buyUsdtDialog"
            :price="usdtInfo.price"
            :userBalance="userBalance"
            :iconUrl="usdtInfo.icon"
            @success="handleBuyUsdtSuccess"
          />
        </view>
      </template>
      
      <script lang="ts" setup>
      import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
      import { getEquityInfo, getMyEquity, sellEquity, EquityData, EquityInfo } from '@/service/app/equity';
      import { getPlatformOrders, getUserCurrencies, buyUsdt, getUserBalance } from '@/service/app/currency';
      import { httpGet } from "@/utils/http";
      import type { UserCurrency } from '@/service/app/types';
      import SellEquityPopup from '@/components/equity/SellEquityPopup.vue';
      import BuyUsdtDialog from '@/components/currency/BuyUsdtDialog.vue';
      import { useTabItemTap } from '@/hooks/useTabItemTap';
      
      // 控制资产显示隐藏
      const showAssets = ref(true);
      
      // 资产信息
      const totalAssets = ref(26850.75);
      const currencyAssets = ref(15850.75);
      const equityAssets = ref(11000.00);
      
      // 当前激活的标签页
      const activeTab = ref('currency');
      const activeCurrencyTab = ref('buy');
      
      // 股权信息
      const equityPrice = ref(11.00);
      const myEquity = ref(1000);
      
      // 加载中状态
      const loading = ref(false);
      
      // 图表时间周期
      const timePeriods = [
        { label: '日', value: 'day' },
        { label: '周', value: 'week' },
        { label: '月', value: 'month' },
        { label: '年', value: 'year' }
      ];
      const activePeriod = ref('day');
      
      // 货币列表，这里将改为从API获取
      const currencies = reactive<any[]>([]);
      
      // 用户持有的货币
      const userCurrencies = ref<any[]>([]);
      
      // 股权出售弹窗
      const sellEquityPopup = ref(null);
      
      // USDT购买弹窗
      const buyUsdtDialog = ref(null);
      
      // USDT信息
      const usdtInfo = ref({
        id: 0,
        price: 1.0,
        icon: '',
      });
      
      // 用户余额
      const userBalance = ref(0);
      
      // 获取货币图标URL
      const getCurrencyIconUrl = (iconPath: string) => {
        if (!iconPath) return '';
        
        // 如果已经是完整URL，直接返回
        if (iconPath.startsWith('http')) {
          return iconPath;
        }
        
        // 否则拼接基础URL
        return `https://xxx.noneloxbqlo.cn/storage/${iconPath}`;
      };
      
      // 从API获取货币订单数据
      const fetchCurrencyOrders = async () => {
        // 如果已经在加载中，则跳过
        if (loading.value) return;
        
        loading.value = true;
        try {
          // 根据当前标签获取买入或卖出订单
          const orderType = activeCurrencyTab.value;
          
          // 获取平台发布的货币订单（平台卖出 = 用户买入，平台买入 = 用户卖出）
          const response = await getPlatformOrders({
            type: orderType === 'buy' ? 'sell' : 'buy'
          });
          
          console.log('获取平台货币订单响应:', JSON.stringify(response));
          
          if (response.status === 'success' && response.data) {
            // 清空现有数组
            currencies.length = 0;
            
            // 处理数据，不再过滤掉USDT的货币订单并转换格式
            if (Array.isArray(response.data)) {
              for (let i = 0; i < response.data.length; i++) {
                const order = response.data[i];
                // 排除USDT订单，因为我们会手动添加USDT
                if (order.currency_symbol !== 'USDT') {
                  currencies.push({
                    id: order.currency_id, // 使用货币ID而不是订单ID
                    orderId: order.id, // 保留订单ID用于交易
                    name: order.currency_name,
                    symbol: order.currency_symbol,
                    iconUrl: getCurrencyIconUrl(order.currency_icon),
                    buyPrice: parseFloat(order.price.toString()),
                    sellPrice: parseFloat(order.price.toString()),
                    holdAmount: 0, // 这将在后面更新
                    totalAmount: parseFloat(order.amount.toString()),
                    remainingAmount: parseFloat(order.remaining_amount.toString()),
                    minAmount: parseFloat(order.min_order_amount.toString()),
                    maxAmount: parseFloat(order.amount.toString()),
                    fee: parseFloat(order.fee_rate.toString()),
                    unit: '个',
                    bgColor: getBgColorBySymbol(order.currency_symbol)
                  });
                }
              }
            }
            
            // 如果是买入标签，添加USDT货币
            if (activeCurrencyTab.value === 'buy') {
              // 获取USDT信息
              await fetchUsdtInfo();
            }
            
            // 无论是买入还是卖出标签，都获取用户持有的货币数量以便在界面上显示
            await fetchUserCurrencies();
            
            // 获取用户余额
            await fetchUserBalance();
          }
        } catch (error) {
          console.error('获取货币订单失败:', error);
        } finally {
          // 延迟关闭加载状态，让用户看到加载指示器
          setTimeout(() => {
            loading.value = false;
          }, 500);
        }
      };
      
      // 获取USDT信息并添加到货币列表中
      const fetchUsdtInfo = async () => {
        try {
          // 获取USDT信息，使用GET请求访问buy-usdt接口
          const response = await httpGet<{
            status: string;
            data: {
              currency: {
                id: number;
                name: string;
                symbol: string;
                icon: string;
                price: number;
                min_transaction_amount: number;
                max_transaction_amount: number;
              };
              user_balance: number;
              user_has_usdt: boolean;
            }
          }>('/api/orders/buy-usdt');
          
          console.log('获取USDT信息响应:', JSON.stringify(response));
          
          if (response.status === 'success' && response.data && response.data.currency) {
            const usdtData = response.data.currency;
            
            // 保存USDT信息，用于购买弹窗
            usdtInfo.value = {
              id: usdtData.id,
              price: usdtData.price,
              icon: usdtData.icon,
            };
            
            // 创建USDT币种信息并添加到货币列表中
            currencies.push({
              id: usdtData.id,
              orderId: 0, // USDT没有平台订单ID
              name: usdtData.name,
              symbol: 'USDT',
              iconUrl: getCurrencyIconUrl(usdtData.icon),
              buyPrice: usdtData.price,
              sellPrice: usdtData.price,
              holdAmount: 0, // 这将在fetchUserCurrencies中更新
              totalAmount: 1000000, // 一个比较大的数字
              remainingAmount: 1000000, // 一个比较大的数字
              minAmount: usdtData.min_transaction_amount,
              maxAmount: usdtData.max_transaction_amount,
              fee: 0, // USDT通常不收手续费
              unit: '个',
              bgColor: getBgColorBySymbol('USDT')
            });
            
            console.log('添加USDT到货币列表:', currencies[currencies.length - 1]);
          }
        } catch (error) {
          console.error('获取USDT信息失败:', error);
        }
      };
      
      // 获取用户余额
      const fetchUserBalance = async () => {
        try {
          // 直接使用getUserBalance API获取用户余额
          const response = await getUserBalance();
          
          if (response.status === 'success' && response.data !== undefined) {
            userBalance.value = parseFloat(response.data.toString() || '0');
            console.log('用户余额:', userBalance.value);
          }
        } catch (error) {
          console.error('获取用户余额失败:', error);
        }
      };
      
      // 获取用户持有的货币
      const fetchUserCurrencies = async () => {
        try {
          const response = await getUserCurrencies();
          console.log('获取用户持有货币响应:', JSON.stringify(response));
          
          if (response.status === 'success' && Array.isArray(response.data)) {
            // 创建一个用户货币映射表，便于快速查找
            const userCurrencyMap = new Map();
            
            // 遍历用户货币并建立映射，使用user_available_balance作为持有量
            response.data.forEach(currency => {
              if (currency && currency.symbol) {
                // 使用user_available_balance作为用户持有量
                const availableBalance = typeof currency.user_available_balance === 'number' 
                  ? currency.user_available_balance 
                  : parseFloat(currency.user_available_balance || '0');
                userCurrencyMap.set(currency.symbol, availableBalance);
              }
            });
            
            // 更新货币列表中的持有数量
            for (let i = 0; i < currencies.length; i++) {
              const currency = currencies[i];
              // 从映射表中查找对应的持有量
              if (userCurrencyMap.has(currency.symbol)) {
                currency.holdAmount = userCurrencyMap.get(currency.symbol);
              } else {
                currency.holdAmount = 0; // 如果用户没有持有该货币，则设为0
              }
            }
            
            console.log('更新后的货币列表:', JSON.stringify(currencies));
          }
        } catch (error) {
          console.error('获取用户持有货币失败:', error);
        }
      };
      
      // 根据货币符号获取背景颜色
      const getBgColorBySymbol = (symbol: string) => {
        const colorMap: Record<string, string> = {
          'GOLD': 'rgba(243, 156, 18, 0.2)',
          'SILVER': 'rgba(189, 195, 199, 0.2)',
          'PLATINUM': 'rgba(52, 152, 219, 0.2)',
          // 可以添加更多颜色映射
        };
        
        return colorMap[symbol] || 'rgba(149, 165, 166, 0.2)'; // 默认颜色
      };
      
      // 根据当前选择的标签过滤货币列表
      const filteredCurrencies = computed(() => {
        if (activeCurrencyTab.value === 'buy') {
          // 买入标签：显示有剩余数量的货币
          return currencies.filter(item => item.remainingAmount > 0);
        } else {
          // 卖出标签：显示用户持有量大于0的货币
          return currencies.filter(item => item.remainingAmount > 0 && item.holdAmount > 0);
        }
      });
      
      // 格式化金额显示
      const formatAmount = (amount: number) => {
        // 处理undefined、null或NaN的情况
        if (amount === undefined || amount === null || isNaN(amount)) {
          return '0.00';
        }
        return amount.toFixed(2);
      };
      
      // 获取股权信息
      const fetchEquityData = async () => {
        loading.value = true;
        try {
          // 获取股权基本信息
          const equityResponse = await getEquityInfo();
          console.log('交易所页面获取股权基本信息响应:', JSON.stringify(equityResponse));
          
          if (equityResponse.status === 'success' && equityResponse.data) {
            // 获取股权价格 - 直接从response中获取
            const price = parseFloat(equityResponse.data.price || "1.00");
            equityPrice.value = price;
            console.log('股权价格:', price);
          } else {
            console.warn('获取股权基本信息失败或返回数据为空');
            equityPrice.value = 0;
          }
          
          // 获取用户股权持有量
          const myEquityResponse = await getMyEquity();
          console.log('交易所页面获取用户股权持有量响应:', JSON.stringify(myEquityResponse));
          
          if (myEquityResponse.status === 'success' && myEquityResponse.data) {
            if (myEquityResponse.data.user_equity) {
              // 获取用户持有的股权数量
              const equity = parseFloat(myEquityResponse.data.user_equity.share_amount.toString() || "0");
              myEquity.value = equity;
              console.log('我的股权:', equity);
              
              // 计算股权资产总价值
              const equityValue = equity * equityPrice.value;
              equityAssets.value = equityValue;
              console.log('股权资产总价值:', equityValue);
              
              // 更新总资产
              totalAssets.value = currencyAssets.value + equityAssets.value;
              console.log('更新后的总资产:', totalAssets.value);
            } else {
              console.warn('用户股权数据结构不符合预期:', myEquityResponse.data);
              myEquity.value = 0;
              equityAssets.value = 0;
            }
          } else {
            console.warn('获取用户股权持有量失败或返回数据为空');
            myEquity.value = 0;
            equityAssets.value = 0;
          }
        } catch (error) {
          console.error('获取股权数据错误:', error);
          // 出错时重置股权相关数值
          equityPrice.value = 0;
          myEquity.value = 0;
          equityAssets.value = 0;
        } finally {
          loading.value = false;
        }
      };
      
      // 切换资产标签
      const switchTab = (tab: string) => {
        activeTab.value = tab;
        if (tab === 'equity') {
          fetchEquityData();
        } else {
          // 切换到货币标签时刷新货币订单
          fetchCurrencyOrders();
        }
      };
      
      // 切换货币交易子标签
      const switchCurrencyTab = (tab: string) => {
        activeCurrencyTab.value = tab;
        // 切换标签时重新获取货币订单
        fetchCurrencyOrders();
      };
      
      // 导航到指定页面
      const navigateTo = (url: string) => {
        uni.navigateTo({
          url
        });
      };
      
      // 处理交易操作
      const handleTrade = (item: any) => {
        // 如果是卖出操作，且用户没有持有该货币，则不允许交易
        if (activeCurrencyTab.value === 'sell' && item.holdAmount <= 0) {
          uni.showToast({
            title: '您没有持有该货币',
            icon: 'none'
          });
          return;
        }
        
        // USDT特殊处理，使用专门的USDT购买弹窗
        if (activeCurrencyTab.value === 'buy' && item.symbol === 'USDT') {
          openBuyUsdtDialog(item);
          return;
        }
        
        // 获取正确的价格参数
        let price = 0;
        if (activeCurrencyTab.value === 'buy') {
          price = item.buyPrice;
        } else {
          price = item.sellPrice;
        }
        
        // 计算最大可交易量
        // 买入：受平台剩余货币量限制
        // 卖出：受用户持有货币量限制
        const maxTradeAmount = activeCurrencyTab.value === 'sell' 
          ? Math.min(item.maxAmount, item.holdAmount) 
          : item.maxAmount;
        
        console.log('传递到交易详情页的数据:', {
          id: item.id, // 货币ID
          orderId: item.orderId, // 订单ID
          name: item.name,
          symbol: item.symbol,
          price: price,
          type: activeCurrencyTab.value,
          iconUrl: item.iconUrl || '',
          fee: item.fee,
          minAmount: item.minAmount,
          maxAmount: maxTradeAmount,
          holdAmount: item.holdAmount
        });
        
        // 拼接参数，包含更多详细信息，使用货币ID作为id参数
        const params = `id=${item.id}&orderId=${item.orderId}&name=${encodeURIComponent(item.name)}&symbol=${item.symbol}&price=${price}&type=${activeCurrencyTab.value}&iconUrl=${encodeURIComponent(item.iconUrl || '')}&fee=${item.fee}&minAmount=${item.minAmount}&maxAmount=${maxTradeAmount}&holdAmount=${item.holdAmount}`;
        
        // 跳转到交易详情页面
        navigateTo(`/pages/trading/trade-detail?${params}`);
      };
      
      // 打开购买USDT弹窗
      const openBuyUsdtDialog = (item: any) => {
        if (item.symbol !== 'USDT') return;
        
        // 设置USDT信息
        usdtInfo.value = {
          id: item.id,
          price: item.buyPrice,
          icon: item.iconUrl,
        };
        
        // 打开弹窗
        if (buyUsdtDialog.value) {
          (buyUsdtDialog.value as any).open();
        }
      };
      
      // 处理USDT购买成功
      const handleBuyUsdtSuccess = () => {
        // 刷新货币订单和用户货币数据
        fetchCurrencyOrders();
      };
      
      // 处理出售股权操作
      const handleSellEquity = () => {
        if (myEquity.value <= 0) {
          uni.showToast({
            title: '您没有可出售的股权',
            icon: 'none'
          });
          return;
        }
        sellEquityPopup.value.open();
      };
      
      // 关闭出售股权弹窗
      const closeSellEquityPopup = () => {
        // 弹窗已通过组件内部自动关闭，无需额外处理
      };
      
      // 确认出售股权
      const confirmSellEquity = async (amount: number) => {
        try {
          uni.showLoading({ title: '处理中...' });
          
          const response = await sellEquity(amount);
          
          if (response.status === 'success') {
            uni.showToast({
              title: '出售成功',
              icon: 'success'
            });
            
            // 刷新股权数据
            await fetchEquityData();
          } else {
            uni.showToast({
              title: response.message || '出售失败',
              icon: 'none'
            });
          }
        } catch (error) {
          console.error('出售股权失败:', error);
          uni.showToast({
            title: '出售失败，请重试',
            icon: 'none'
          });
        } finally {
          uni.hideLoading();
        }
      };
      
      // 使用TabBar切换钩子，自动刷新交易所数据
      useTabItemTap({
        refreshUserInfo: false, // 交易所页面不需要刷新用户信息
        pageName: '交易所页面',
        onTabTap: () => {
          console.log('交易所页面Tab被点击，刷新当前选中的数据');
          // 根据当前选中的标签刷新对应数据
          if (activeTab.value === 'currency') {
            fetchCurrencyOrders();
          } else {
            fetchEquityData();
          }
        }
      });
      
      // 页面加载时获取数据
      onMounted(() => {
        if (activeTab.value === 'currency') {
          fetchCurrencyOrders();
        } else {
          fetchEquityData();
        }

        // 监听交易完成事件
        uni.$on('trade_completed', (data) => {
          console.log('接收到交易完成事件:', data);
          // 根据交易类型切换到对应的标签并刷新数据
          if (activeTab.value === 'currency') {
            if (data.type === 'buy' || data.type === 'sell') {
              activeCurrencyTab.value = data.type;
            }
            fetchCurrencyOrders();
          }
        });
      });
      
      // 在页面卸载时移除事件监听
      onUnmounted(() => {
        uni.$off('trade_completed');
      });
      
      // 添加刷新数据方法，可以被其他页面调用
      // 这个方法需要放在当前模块的顶层作用域
      const refreshData = () => {
        console.log('交易所页面刷新数据');
        if (activeTab.value === 'currency') {
          fetchCurrencyOrders();
        } else {
          fetchEquityData();
        }
      };
      
      // 暴露给页面实例以便外部调用
      defineExpose({
        refreshData
      });
      </script>
      
      <style lang="scss">
      /* 全局重置 */
      page {
        background-color: #f5f5f5;
        height: 100%;
        font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
      }
      
      /* 容器样式 */
      .trading-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        position: relative;
      }
      
      /* 顶部波浪装饰 */
      .wave-decoration {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 16rpx;
        background: linear-gradient(to right, #f39c12, #e74c3c);
        z-index: 2;
      }
      
      /* 顶部横幅 */
      .header-banner {
        width: 100%;
        height: 120rpx;
        position: relative;
        overflow: hidden;
      }
      
      .banner-image {
        width: 100%;
        height: 100%;
      }
      
      /* 交易记录按钮 */
      .transaction-record-btn {
        position: absolute;
        top: 60rpx;
        right: 20rpx;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 30rpx;
        padding: 8rpx 20rpx;
        display: flex;
        align-items: center;
        z-index: 10;
        box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
      }
      
      .transaction-record-btn .uni-icons {
        font-size: 28rpx;
        color: #555;
        margin-right: 6rpx;
      }
      
      .btn-text {
        font-size: 24rpx;
        color: #555;
      }
      
      /* 资产卡片 */
      .asset-card {
        background-color: white;
        border-radius: 20rpx;
        margin: -40rpx 30rpx 30rpx;
        padding: 30rpx;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
        position: relative;
        z-index: 1;
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
      }
      
      .card-title {
        color: #666;
        font-size: 28rpx;
      }
      
      .visibility-toggle {
        padding: 10rpx;
      }
      
      .visibility-toggle .uni-icons {
        font-size: 36rpx;
        color: #999;
      }
      
      .assets-amount {
        margin-bottom: 30rpx;
      }
      
      .amount-value {
        font-size: 60rpx;
        font-weight: 600;
        color: #333;
      }
      
      .amount-hidden {
        font-size: 60rpx;
        font-weight: 600;
        color: #333;
        letter-spacing: 5rpx;
      }
      
      /* 资产明细 */
      .assets-breakdown {
        display: flex;
        justify-content: space-around;
        border-top: 1px solid #f0f0f0;
        padding-top: 20rpx;
      }
      
      .breakdown-item {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .breakdown-label {
        font-size: 26rpx;
        color: #666;
        margin-bottom: 10rpx;
      }
      
      .breakdown-value {
        font-size: 36rpx;
        font-weight: 500;
        color: #333;
      }
      
      /* 交易所标题 */
      .section-title {
        padding: 20rpx 30rpx;
      }
      
      .section-title text {
        font-size: 34rpx;
        font-weight: 600;
        color: #333;
        position: relative;
        padding-left: 20rpx;
      }
      
      .section-title text::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 30rpx;
        background: linear-gradient(to bottom, #f39c12, #e74c3c);
        border-radius: 4rpx;
      }
      
      /* 资产类型切换 */
      .asset-tabs {
        display: flex;
        background-color: white;
        margin: 0 30rpx 30rpx;
        border-radius: 20rpx;
        overflow: hidden;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
      }
      
      .tab-item {
        flex: 1;
        height: 100rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        color: #666;
        position: relative;
      }
      
      .tab-active {
        color: #f39c12;
        font-weight: 500;
      }
      
      .tab-active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 6rpx;
        background: linear-gradient(to right, #f39c12, #e74c3c);
      }
      
      /* 内容区域 */
      .tab-content {
        background-color: white;
        border-radius: 20rpx;
        margin: 0 30rpx 30rpx;
        padding: 30rpx;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
      }
      
      /* 货币交易子标签 */
      .currency-tabs {
        display: flex;
        border-radius: 10rpx;
        overflow: hidden;
        background-color: #f0f0f0;
        margin-bottom: 30rpx;
      }
      
      .currency-tab-item {
        flex: 1;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30rpx;
        color: #666;
      }
      
      .currency-tab-active {
        background: linear-gradient(135deg, #f39c12, #e74c3c);
        color: white;
        font-weight: 500;
      }
      
      /* 货币列表 */
      .currency-list {
        margin-top: 20rpx;
      }
      
      .currency-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 30rpx 0;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .currency-item:last-child {
        border-bottom: none;
      }
      
      .currency-info-container {
        display: flex;
        align-items: center;
        flex: 1;
      }
      
      .currency-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
      }
      
      .currency-icon-text {
        font-size: 36rpx;
        color: #333;
        font-weight: bold;
      }
      
      .currency-info {
        flex: 1;
      }
      
      .currency-name {
        font-size: 30rpx;
        color: #333;
        margin-bottom: 8rpx;
        display: block;
        font-weight: 500;
      }
      
      .currency-symbol {
        font-size: 24rpx;
        color: #999;
        font-weight: normal;
      }
      
      .currency-price {
        font-size: 28rpx;
        color: #e74c3c;
        margin-bottom: 8rpx;
        display: block;
      }
      
      .holding-info {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
      }
      
      .holding-amount {
        font-size: 24rpx;
        color: #666;
        margin-right: 20rpx;
      }
      
      .fee-info {
        font-size: 24rpx;
        color: #999;
      }
      
      .limit-info {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
      }
      
      .limit-text, .remaining-text {
        font-size: 24rpx;
        color: #999;
        margin-right: 20rpx;
      }
      
      .trade-btn {
        min-width: 120rpx;
        height: 70rpx;
        border: none;
        border-radius: 35rpx;
        background: linear-gradient(to right, #f39c12, #e74c3c);
        color: white;
        font-size: 28rpx;
        line-height: 70rpx;
        margin-left: 20rpx;
      }
      
      .sell-btn {
        background: linear-gradient(to right, #3498db, #2980b9);
      }
      
      .disabled-btn {
        background: #cccccc !important;
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      /* 空状态 */
      .empty-state {
        padding: 60rpx 0;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .empty-text {
        color: #999;
        font-size: 28rpx;
      }
      
      /* 股权卡片 */
      .equity-card {
        background: linear-gradient(135deg, #f9f9f9, #f0f0f0);
        border-radius: 16rpx;
        padding: 30rpx;
        margin-bottom: 30rpx;
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      }
      
      .equity-info-container {
        display: flex;
        justify-content: space-around;
        margin-bottom: 30rpx;
      }
      
      .equity-info-item {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .equity-divider {
        width: 1px;
        background-color: #e0e0e0;
      }
      
      .equity-label {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 15rpx;
      }
      
      .equity-value-container {
        display: flex;
        align-items: baseline;
      }
      
      .equity-value {
        font-size: 40rpx;
        font-weight: 600;
        color: #333;
        margin-right: 8rpx;
      }
      
      .equity-unit {
        font-size: 24rpx;
        color: #666;
      }
      
      .sell-equity-btn {
        width: 100%;
        height: 90rpx;
        border: none;
        border-radius: 45rpx;
        background: linear-gradient(to right, #f39c12, #e74c3c);
        color: white;
        font-size: 32rpx;
        font-weight: 500;
        box-shadow: 0 8rpx 20rpx rgba(243, 156, 18, 0.3);
      }
      
      /* 股权趋势图卡片 */
      .equity-trend-card {
        background-color: white;
        border-radius: 16rpx;
        padding: 30rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;
      }
      
      .time-selector {
        display: flex;
        background-color: #f0f0f0;
        border-radius: 20rpx;
        overflow: hidden;
      }
      
      .time-option {
        padding: 6rpx 16rpx;
        font-size: 24rpx;
        color: #666;
      }
      
      .time-active {
        background-color: #f39c12;
        color: white;
      }
      
      .chart-container {
        height: 400rpx;
        border-radius: 10rpx;
        overflow: hidden;
      }
      
      .chart-placeholder {
        width: 100%;
        height: 100%;
        background-color: #f8f8f8;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 28rpx;
      }
      
      .currency-image {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
      }
      
      /* 添加刷新按钮样式 */
      .refresh-btn {
        position: absolute;
        right: 20rpx;
        top: 50%;
        transform: translateY(-50%);
        width: 60rpx;
        height: 60rpx;
        border-radius: 30rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        color: #999;
        background-color: rgba(243, 156, 18, 0.1);
        transition: all 0.3s;
      }
      
      .refresh-btn.refreshing {
        background-color: rgba(243, 156, 18, 0.2);
        color: #f39c12;
      }
      
      .refresh-btn:active {
        background-color: rgba(243, 156, 18, 0.3);
        color: #f39c12;
      }
      
      .refresh-text {
        display: none;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .spin {
        animation: spin 1s linear infinite;
      }
      </style> 