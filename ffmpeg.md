# FFMPEG commands

Convert .mp4 to .ogv

```
ffmpeg -i gmao_co2_cropped.mp4 -q:v 10 -c:v ogv -c:a oga gmao_co2_cropped.ogv
```

Get frames from movie (30fps)

```
ffmpeg -i co2_text_deflect.mov -r 30/1 -q:v 1 co2_text_deflect/frame%04d.png
ffmpeg -i co2_ref.mov -r 30/1 -q:v 1 ref/frame%04d.png
```

Box blur video 30x

```
ffmpeg -i net_radiation_30fps.mp4 -vf "boxblur=30:1" net_radiation_30fps_blur30.mp4
```

Increase frame rate from 10fps to 30fps with interpolation using [butterflow](https://github.com/dthpham/butterflow)

```
butterflow -r 30 net_radiation_10fps.mp4
```
