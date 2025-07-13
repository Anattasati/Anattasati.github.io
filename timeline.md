---
layout: page
title: Timeline
permalink: /timeline/
---

<div class="timeline">
  {% for post in site.posts %}
    <div class="timeline-item">
      <div class="timeline-date">
        {{ post.date | date: "%b %d, %Y" }}
      </div>
      <div class="timeline-content">
        <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
        <div class="timeline-excerpt">
          {{ post.excerpt | strip_html | truncatewords: 20 }}
        </div>
        {% if post.categories.size > 0 %}
          <div class="timeline-categories">
            {% for category in post.categories %}
              <span class="category-tag">{{ category }}</span>
            {% endfor %}
          </div>
        {% endif %}
      </div>
    </div>
  {% endfor %}
</div>

<style>
.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e1e1e1;
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
  padding-left: 80px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 41px;
  top: 5px;
  width: 18px;
  height: 18px;
  background: #2a7ae4;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 3px #e1e1e1;
}

.timeline-date {
  font-size: 0.9em;
  color: #666;
  font-weight: 500;
  margin-bottom: 5px;
}

.timeline-content h3 {
  margin: 0 0 10px 0;
  font-size: 1.2em;
}

.timeline-content h3 a {
  text-decoration: none;
  color: #2a7ae4;
}

.timeline-content h3 a:hover {
  text-decoration: underline;
}

.timeline-excerpt {
  color: #666;
  line-height: 1.5;
  margin-bottom: 10px;
}

.timeline-categories {
  margin-top: 10px;
}

.category-tag {
  display: inline-block;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-right: 5px;
  color: #666;
}

@media (max-width: 600px) {
  .timeline::before {
    left: 20px;
  }
  
  .timeline-item {
    padding-left: 50px;
  }
  
  .timeline-item::before {
    left: 11px;
  }
}
</style>
