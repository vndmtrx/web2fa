all: http

http:
	sass --sourcemap=none styles.scss styles.css
	python3 -m http.server 8080 --bind 0.0.0.0
