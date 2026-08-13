# Social posts: fix modulenotfounderror python

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-modulenotfounderror-python/

## X / Twitter
```
> First check whether the import name matches the package name, because many do not: `import yaml` comes from `PyYAML`, `import cv2` from `opencv-python`.

https://www.kloudbean.com/blog/fix-modulenotfounderror-python/
#Kloudbean #CloudHosting #DevOps #WebDev #Python
```

## LinkedIn
```
> First check whether the import name matches the package name, because many do not: `import yaml` comes from `PyYAML`, `import cv2` from `opencv-python`.

Then confirm you installed into the interpreter that is running by using `python -m pip install` rather than bare `pip`. If the module name starts with an underscore, such as `_sqlite3` or `_ctypes`, no pip package will help, because your Python was built without that standard library extension. And if the missing module is your own code, it is a working directory or `PYTHONPATH` problem, not a package problem.

Read the full guide: https://www.kloudbean.com/blog/fix-modulenotfounderror-python/

#Kloudbean #CloudHosting #DevOps #WebDev #Python
```

## X thread
```
1/6  fix modulenotfounderror python

Quick thread 🧵
```
```
2/6  > First check whether the import name matches the package name, because many do not: `import yaml` comes from `PyYAML`, `import cv2` from `opencv-python`.
```
```
3/6  Then confirm you installed into the interpreter that is running by using `python -m pip install` rather than bare `pip`.
```
```
4/6  If the module name starts with an underscore, such as `_sqlite3` or `_ctypes`, no pip package will help, because your Python was built without that standard library extension.
```
```
5/6  And if the missing module is your own code, it is a working directory or `PYTHONPATH` problem, not a package problem.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-modulenotfounderror-python/
#Kloudbean #CloudHosting #DevOps #WebDev #Python
```
