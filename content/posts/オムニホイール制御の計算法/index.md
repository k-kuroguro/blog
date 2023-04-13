---
title: "オムニホイール制御の計算法"
publishDate: 2023-04-11T22:40:31+09:00
slug: 2023041136rhjz2
author: k-kuroguro
categories: ["技術記事"]
tags: ["ロボット"]
comments: true
math: true
draft: false
---

## オムニホイールとは

{{< youtube oCm66wa7ZS4 >}}

**オムニホイール** (Omni Wheel) は上の動画のロボットに取り付けられているような, 回転方向と垂直に回転するローラーを備えるホイールのことである. これらのローラーにより, ロボットは全方向への移動が可能となっている.

{{< figure src="https://upload.wikimedia.org/wikipedia/commons/e/e3/Triple_Rotacaster_commercial_industrial_omni_wheel.jpg" caption="図1. オムニホイール. Rotacaster, [CC BY 1.0](https://creativecommons.org/licenses/by/1.0), via Wikimedia Commons."  align="center">}}

4輪の場合, 図2に示すような $45^\circ$ 間隔の単純な移動では, ホイールの回転方向のみで簡単に移動方向を決定できる. しかし, $15^\circ$ や $165^\circ$ 方向などの場合は計算が必要になる. この記事ではその計算方法について記す.

{{< figure src="simple_movement.svg" caption="図2. ロボットの移動方向とホイールの回転方向の関係."  align="center" width="600">}}

## ホイールの角速度の導出

まず, オムニホイールを3輪搭載した全方位ロボットを例として考え, 各ホイールの角速度を求めてみる. その後, n輪について一般化する. ロボットの各要素の運動学的関係を表すモデルを図3に示す.

{{< figure src="kinematic_model_of_omni_directional_robot.svg" caption="図3. 全方位ロボットの運動学的モデル."  align="center" width="500">}}

はじめにロボットの環境を表すグローバル座標 $[x,y]$ を定義する. グローバル座標におけるロボットの位置と向き・速度はそれぞれ $\bm{u}=(x,y,\theta)^\mathsf{T}, \dot{\bm{u}}=(\dot{x},\dot{y}, \dot{\theta})^\mathsf{T}$ と表せる.

続いて, ローカル座標 $[x_{\mathrm{L}},y_{\mathrm{L}}]$ も定義する. ローカル座標の中心はロボットの重心と一致する. 3つのオムニホイールはローカル座標系に対し, 角度 $\alpha_i (i=1,2,3)$ で配置されている. 等間隔に配置すれば軸 $x_{\mathrm{L}}$ を始点, 反時計回りを正とし, $\alpha_1 = 0^\circ, \alpha_2 = 120^\circ, \alpha_3 = 240^\circ$ となる.

また, ホイール半径を $r$, ロボットの重心からホイール中心までの距離を $R$, ホイールの移動速度を $\bm{v}=(v_0,v_1,v_2)^\mathsf{T}$, 角速度を $\dot{\bm{\phi}}=(\dot{\phi_0},\dot{\phi_1},\dot{\phi}_2)^\mathsf{T}$ とする.

以上の定義から $v_i$ を求める. これは純粋な並進速度と回転速度に分けることができる.

$$
v_i=v_{\mathrm{trans},i}+v_{\mathrm{rot}}
$$

まず, 並進速度について考える. 図4にホイール1における並進速度 $v_{\mathrm{trans},1}$ を拡大したものを示す.

{{< figure src="enlarged_figure_of_vector.svg" caption="図4. ベクトル拡大図."  align="center" width="300">}}

$v_{\mathrm{trans},1}$ を $\dot{x}, \dot{y}$ に写像すると次式が得られる.


$$
v_{\mathrm{trans},1}=-\sin{(\theta})\dot{x}+\cos{(\theta)}\dot{y}
$$

各ホイールが $\theta+\alpha_i$ に配置されていることを考慮すれば, この写像を全てのホイールに対して一般化できる.

$$
v_{\mathrm{trans},i}=-\sin{(\theta+\alpha_i})\dot{x}+\cos{(\theta+\alpha_i)}\dot{y}
$$

続いて, 回転速度について考える. ロボットが純粋に回転する場合, 以下の条件を満たす.

$$
v_{\mathrm{rot}}=R\dot{\theta}
$$

以上より

$$
\begin{equation}
   v_i=-\sin{(\theta+\alpha_i})\dot{x}+\cos{(\theta+\alpha_i)}\dot{y}+R\dot{\theta}
\end{equation}
$$

これで各ホイールの移動速度とロボットの移動速度が関連付けられた. 次はホイールの角速度について立式する.

$$
\begin{equation}
   v_i=r\dot{\phi}_i
\end{equation}
$$

ここで式$(1)$に式$(2)$を代入して

$$
\dot{\phi}_i=\frac{1}{r}\{-\sin{(\theta+\alpha_i})\dot{x}+\cos{(\theta+\alpha_i)}\dot{y}+R\dot{\theta}\}
$$

上式は, 式$(3)$のような行列表現に変換できる.

<div>
$$
\begin{equation}
   \begin{bmatrix}
      \dot{\phi}_1 \\
      \dot{\phi}_2 \\
      \dot{\phi}_3 \\
   \end{bmatrix}
   =
   \frac{1}{r}
   \begin{bmatrix}
      -\sin{(\theta)}&\cos{(\theta)}&R\\
      -\sin{(\theta+\alpha_2)}&\cos{(\theta+\alpha_2)}&R\\
      -\sin{(\theta+\alpha_3)}&\cos{(\theta+\alpha_3)}&R\\
   \end{bmatrix}
   \begin{bmatrix}
      \dot{x}\\
      \dot{y}\\
      \dot{\theta}\\
   \end{bmatrix}
\end{equation}
$$
</div>

上式はグローバル座標系を使用しているため, 次式でローカル座標系に変換する.

<div>
$$
\begin{equation}
   \begin{bmatrix}
      \dot{x}\\
      \dot{y}\\
      \dot{\theta}\\
   \end{bmatrix}
   =
   \begin{bmatrix}
      \cos{(\theta)}&0&0\\
      0&\cos{(\theta)}&0\\
      0&0&1\\
   \end{bmatrix}
   \begin{bmatrix}
      \dot{x}_\mathrm{L}\\
      \dot{y}_\mathrm{L}\\
      \dot{\theta}\\
   \end{bmatrix}
\end{equation}
$$
</div>

式$(4)$を式$(3)$に代入し

<div>
$$
\begin{equation}
   \begin{bmatrix}
      \dot{\phi}_1\\
      \dot{\phi}_2\\
      \dot{\phi}_3\\
   \end{bmatrix}
   =
   \frac{1}{r}
   \begin{bmatrix}
      -\sin{(\theta)}&\cos{(\theta)}&R\\
      -\sin{(\theta+\alpha_2)}&\cos{(\theta+\alpha_2)}&R\\
      -\sin{(\theta+\alpha_3)}&\cos{(\theta+\alpha_3)}&R\\
   \end{bmatrix}
   \begin{bmatrix}
      \cos{(\theta)}&0&0\\
      0&\cos{(\theta)}&0\\
      0&0&1\\
   \end{bmatrix}
   \begin{bmatrix}
      \dot{x}_\mathrm{L}\\
      \dot{y}_\mathrm{L}\\
      \dot{\theta}\\
   \end{bmatrix}
\end{equation}
$$
</div>

式$(5)$は, ホイール数に対して一般化できる.

<div>
$$
\begin{equation}
   \begin{bmatrix}
      \dot{\phi}_1\\
      \dot{\phi}_2\\
      \vdots\\
      \dot{\phi}_n\\
   \end{bmatrix}
   =
   \frac{1}{r}
   \begin{bmatrix}
      -\sin{(\theta)}&\cos{(\theta)}&R\\
      -\sin{(\theta+\alpha_2)}&\cos{(\theta+\alpha_2)}&R\\
      \vdots&\vdots&\vdots\\
      -\sin{(\theta+\alpha_n)}&\cos{(\theta+\alpha_n)}&R\\
   \end{bmatrix}
   \begin{bmatrix}
      \cos{(\theta)}&0&0\\
      0&\cos{(\theta)}&0\\
      0&0&1\\
   \end{bmatrix}
   \begin{bmatrix}
      \dot{x}_\mathrm{L}\\
      \dot{y}_\mathrm{L}\\
      \dot{\theta}\\
   \end{bmatrix}
\end{equation}
$$
</div>

すなわち

<div>
$$
\dot{\phi}_n=\frac{1}{r}\lbrace-\sin{(\theta+\alpha_n)}\cos{(\theta)}\dot{x}_\mathrm{L}+\cos{(\theta+\alpha_n)}\cos{(\theta)}\dot{y}_\mathrm{L}+R\dot{\theta}\rbrace
$$
</div>

以上で, 任意の数のホイールを持つ全方位ロボットにおける各ホイールの角速度が求められた.

## 参考文献

- [オムニホイールを用いた全方向移動車の製作と制御](https://blog.tokor.org/2015/05/14/%E3%82%AA%E3%83%A0%E3%83%8B%E3%83%9B%E3%82%A4%E3%83%BC%E3%83%AB%E3%82%92%E7%94%A8%E3%81%84%E3%81%9F%E5%85%A8%E6%96%B9%E5%90%91%E7%A7%BB%E5%8B%95%E8%BB%8A%E3%81%AE%E8%A3%BD%E4%BD%9C%E3%81%A8%E5%88%B6%E5%BE%A1/)
- [Motion control of an omnidirectional mobile robot](https://pure.tue.nl/ws/files/4283624/633499.pdf)

