const lodash = require('lodash');
const sqlQuery = require('../config/db');
const studentService = require('../services/student');

module.exports = {
    getStudents: async (req, res) => {
        const result = await sqlQuery('SELECT * FROM student');
        return res.render('student/list', {
            activePath: '/students',
            students: result
        });
    },

    getNewStudent: async (req, res) => {
        return res.render('student/new', {
            activePath: '/students'
        });
    },

    postNewStudent: async (req, res) => {
        const name = req.body.name;
        await sqlQuery(`INSERT INTO student (name) values ('${name}')`);
        return res.redirect('/students');
    },

    getRegistration: async (req, res) => {
		let result;
		const studentID = req.params.id;
		const student = await sqlQuery(`SELECT * FROM student
			WHERE id=('${studentID}')`
		);

		const openedCourses = await sqlQuery(`SELECT pre.course_id AS id
			FROM prerequisite AS pre
			INNER JOIN (SELECT course_id
				  FROM registration
				  WHERE student_id=('${studentID}')
					AND mark >= 60
				) AS passedCourses
			ON pre.pre_id=passedCourses.course_id`
		);

		if (openedCourses.length > 0) {
			result = await sqlQuery(`SELECT DISTINCT course.*
				FROM course, student
				WHERE ((('${openedCourses[0].id}')=course.id
						  AND student.semester=course.semester
						  AND course.id NOT IN (SELECT course_id
										FROM registration
										WHERE student_id=('${studentID}')
											AND ((mark >= 60) OR (mark IS NULL))
										)
					  )
					OR (course.id NOT IN (SELECT course_id
										FROM prerequisite
									   )
								AND student.semester=course.semester
								AND course.id NOT IN (SELECT course_id
										FROM registration
										WHERE student_id=('${studentID}')
											AND ((mark >= 60) OR (mark IS NULL))
										)
					)
				)`
			);
		} else {
			result = await sqlQuery(`SELECT DISTINCT course.*
				FROM course, student
				WHERE course.id NOT IN (SELECT course_id
									FROM prerequisite
								   )
					AND student.semester>=course.semester
					AND course.id NOT IN (SELECT course_id
										FROM registration
										WHERE student_id=('${studentID}')
											AND ((mark >= 60) OR (mark IS NULL))
										)`
			);
		};

		return res.render('student/register', {
			activePath: '/students',
			student: student[0],
			allowedCourses: result
		});
	},

    postRegistration: async (req, res) => {
        const Ch_courses = req.body.courses;
        for (var i = 0; i < Ch_courses; i++) {
            const ChosenCourses = await sqlQuery('INSERT INTO registration (student_id, course_id, mark) VALUES (${studentID}, course , NULL)'  );
        }
        
        console.log(req.body);
        return res.redirect('student/allowedCourses', {
            activePath: '/students',
            registration: result
        });

    },

    getAddMarks: async (req, res) => {
		const studentID = req.params.id;
		const student = await sqlQuery(`SELECT * FROM student
			WHERE id=('${studentID}')`
		);

		const result = await sqlQuery(`SELECT * FROM course
			WHERE id IN (SELECT course_id
						FROM registration
						WHERE (student_id=('${studentID}')) AND mark IS NULL)`
		);

		return res.render('student/addMarks', {
			activePath: '/students',
			student: student[0],
			courses: result
		});
    },

    postAddMarks: async (req, res) => {
		const studentID = req.params.id;
		const courses = req.body;
		for (var courseID in courses){
			var courseMark = courses[courseID].length > 0 ? courses[courseID] : 'NULL';
			await sqlQuery(`UPDATE registration
				SET mark=('${courseMark}')
				WHERE ('${courseMark}')!= 'NULL'
					AND student_id=('${studentID}')
					AND course_id=('${courseID}')`
			);
		};

		const gpa = await studentService.getTotalGPA(studentID);
		const semester = await studentService.getSemester(studentID);
		await sqlQuery(`UPDATE student
			SET gpa=('${gpa}'), semester=('${semester}')
			WHERE id=('${studentID}')`
		);

		return res.redirect('/students');
	},

    getViewReport: async (req, res) => {
        // ..
    }
};
