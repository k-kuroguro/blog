---
title: "{{ replace .Name "-" " " | title }}"
publishDate: {{ .Date }}
slug: {{ template "permanentId" }}
author: k-kuroguro
categories: []
tags: []
comments: true
math: false
draft: true
---

{{ define "permanentId" -}}
   {{- $scratch := newScratch -}}
   {{- range (seq 7) -}}
      {{- $nextCh := slice "2" "3" "4" "5" "6" "7" "8" "9" "a" "b" "c" "d" "e" "f" "g" "h" "i" "j" "k" "m" "n" "o" "p" "q" "r" "s" "t" "u" "v" "w" "x" "y" "z" | shuffle | first 1 -}}
      {{- $scratch.Add "id" $nextCh -}}
   {{- end -}}
   {{- printf "%s" (delimit ($scratch.Get "id") "") | printf "%s%s" (now.Format "20060102") | printf "%s" -}}
{{- end -}}
