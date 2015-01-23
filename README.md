
# jiaoxue-server-app

jiaoxue server app

## How to use

```
$ cd jiaoxue-server-app
$ sudo node .
```
open browser to `http://localhost`. 

## server配置说明server/config.js
* prev_path：录制数据存放路径
* live_addr: 需录制流的直播地址
* ffmpeg_path: 修改适合自己的ffmpeg路径

## client配置说明
* course_id: 课程id
* role：
"student" 学生
"teacher" 老师
* biz_type:
"record" 老师上课时
"live" 学生直播课
"playback" 学生回放课
* pdf_addr：课件地址
* live_addr: 学生收听地址
* publish_addr: 老师发布地址
* playback_addr: 学生回放地址
* socketio_addr: 信令地址

## 限制
* 只支持宽比高大的pdf
* pdf资源不支持跨域
