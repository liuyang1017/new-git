/*
  瀑布流的业务逻辑

  分析:
    + 代理请求数据
      => 使用 nginx 配置代理, 确保可以拿到数据
    + 有一个方法来确认所有 ul 里面最短的那一个
      => 因为我的每一个 li 都要填充到最短的 ul 里面
    + 使用获取到的数据渲染页面
      => 拿到数据, 把每一个数据组装成一个 li
      => 放到最短的 ul 里面
    + 实现瀑布流
      => 当页面滚动到底部的时候, 继续加载下一页数据

  代码实现
    1. 准备一个方法, 拿到最短的 ul
      => 获取到所有 ul 的集合
      => 需要不需要每次都获取 ? 不需要, 全局获取一次
      => 循环遍历每一个 ul
      => 假设 [0] 的 ul 高度最短
      => 依次遍历, 如果某一个 ul 的高度比我假设的还短
      => 那么进行替换
    2. 请求数据, 去渲染页面
      => 因为参数 start 表示开始索引
      => 每次请求, 其他内容都一样
      2-1. 把 start 定义为全局变量
      2-2. 准备一个发送请求的函数
        -> 因为下一页的时候, 执行的是一模一样得操作, 只是 start 值不一样
      2-3. 发送请求
        -> 注意代理地址
      2-4. 修改 start 的值
        -> 每次请求成功以后把 start 修改为下一次使用需要用到的内容
      2-5. 执行渲染页面的函数
        -> 结构写在一起, 太长了,
        -> 单独拿一个函数出来
    3. 渲染页面
      3-1. 循环遍历数组
        -> 里面的每一项生成一个 li 标签
      3-2. 把生成的每一个 li 放在 ul 里面
        -> 放在 最短的 ul 里面
    4. 瀑布流加载
      4-1. 给 window 绑定一个 scroll 事件
        => 在事件内部拿到浏览器卷去的高度
      4-2. 判断什么时候加载下一页数据
        => 当 浏览器卷去的高度 + 可视窗口高度 >= 最短 ul 的高度 + ul 的上方偏移量
        => 此时表示最短的 ul 进入页面了, 需要加载
      4-3. 加载下一页
        => 发送请求请求下一页数据, 回来继续进行渲染
        => getData 的方法, 里面就是根据 start 请求数据
        => 执行一下 getDate()
      4-4. 一个问题
        => 因为滚动条会执行很多次事件
        => 导致我一次到底的时候, 会请求很多次
        => 解决:
          -> 当我需要发送一堆请求的时候
          -> 准备一个开关
          -> 发出去第一个请求以后, 把开关关闭
          -> 根据开关判断第二个请求要不要发送
          -> 等到请求回来以后, 页面渲染完毕了, 再把开关打开
          -> 页面渲染完毕以后, 导致 ul 整体变长了, 相当于你不满足加载下一页的条件了
      4-5. loading 效果
        => 当加载的时候, 让他显示
          -> 只要 ajax 发送出去, 就让他显示
        => 等到页面渲染完毕, 让他消失
          -> 页面渲染完毕, 消失
*/
const loading = document.querySelector('.loading')

const uls = document.querySelectorAll('.content > ul')

function getMinUL() {
    let minUL = uls[0]
    for (let i = 0; i < uls.length; i++) {
        if (uls[i].offsetHeight < minUL.offsetHeight) {
            minUL = uls[i]
        }
    }
    return minUL
}


let start = 0

getData()

function getData() {
    ajax({
        url: '/ttter',
        data: `include_fields=top_comments%2Cis_root%2Csource_link%2Citem%2Cbuyable%2Croot_id%2Cstatus%2Clike_count%2Csender%2Calbum%2Creply_count&filter_id=美食菜谱&start=${ start }&_=1605864947127`,
        // data: `include_fields=top_comments%2Cis_root%2Csource_link%2Citem%2Cbuyable%2Croot_id%2Cstatus%2Clike_count%2Csender%2Calbum%2Creply_count&filter_id=%E7%BE%8E%E9%A3%9F%E8%8F%9C%E8%B0%B1&start=96&_=1605864947127`,
        success(res) {
            start += 24
            res = JSON.parse(res)
            bindHtml(res.data.object_list)
        }
    })
    loading.style.display = 'block'
}



function bindHtml(arr) {
    for (let i = 0; i < arr.length; i++) {
        const height = 280 * arr[i].photo.height / arr[i].photo.width
        const str = `
        <li>
            <div class="top" style="height: ${ height }px">
                <img src="${ arr[i].photo.path }" alt="">
            </div>
            <div class="bottom">
              <div class="desc">${ arr[i].msg }</div>
             <div class="info">
               <i></i>
               <span>${ arr[i].like_count }</span>
               <i></i>
               <span>${ arr[i].favorite_count }</span>
             </div>
             <div class="userInfo">
              <div class="left">
               <p>
                <img src="${ arr[i].sender.avatar }" alt="">
                </p>
              </div>
               <div class="right">
                    ${ arr[i].sender.username }
               </div>
             </div>
           </div>
         </li>
        `
        const minUl = getMinUL()

        minUl.innerHTML += str
    }
    flag = true

    loading.style.display = 'none'
}

let falg = true

window.addEventListener('scroll', () => {

    // 浏览器卷去高度
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop

    // 可视窗口宽度
    const window_height = document.documentElement.clientHeight

    // 最短的ul高度
    const minUl = getMinUL()
    const ul_height = minUl.offsetHeight

    // ul上方偏移量
    const ul_top = minUl.offsetTop

    // console.log(scrollTop, window_height, ul_height, ul_top)


    // 判断
    // if 浏览器卷去高度 + 可视窗口宽度 >= 最短的ul高度 + ul上方偏移量 就加载
    if (scrollTop + window_height >= ul_height + ul_top) {
        if (!flag) return

        // 把开关关闭
        flag = false

        // 执行渲染
        getData()
    }



})





//